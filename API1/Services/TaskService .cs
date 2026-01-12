using API.DTOs;
using API.Models;
using API.Repositories;
using API.Services;
using Microsoft.AspNetCore.Http;
using MongoDB.Driver;
using System.Security.Claims;

namespace API.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly ITaskActivityService _activityService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TaskService(
        ITaskRepository taskRepository,
        IProjectRepository projectRepository,
        ITaskActivityService activityService,
        IHttpContextAccessor httpContextAccessor)
    {
        _taskRepository = taskRepository;
        _projectRepository = projectRepository;
        _activityService = activityService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<IEnumerable<TaskItem>> GetTasks(string projectId, string userId, string userRole)
    {
        // Check if user has access to the project
        var project = await _projectRepository.GetProjectById(projectId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found");
        }

        // Check access based on role
        bool hasAccess = userRole == "admin" ||
                        (userRole == "teamleader" && project.teamLeaders.Contains(userId)) ||
                        project.assignedUsers.Contains(userId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You don't have access to this project");
        }

        // Return tasks based on role
        if (userRole == "admin" || (userRole == "teamleader" && project.teamLeaders.Contains(userId)))
        {
            // Admin and team leaders can see all tasks in the project
            return await _taskRepository.GetTasksForProject(projectId, userId, true);
        }
        else
        {
            // Regular users only see tasks assigned to them
            return await _taskRepository.GetTasksForProject(projectId, userId, false);
        }
    }

    public async Task<TaskItem> GetTask(string taskId)
    {
        return await _taskRepository.GetTaskById(taskId);
    }

    public async Task<TaskItem> CreateTask(CreateTaskDto taskDto, string projectId, string userId, string userRole)
    {
        var project = await _projectRepository.GetProjectById(projectId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found");
        }

        // Check if user can create tasks (admin or team leader of the project)
        bool canCreate = userRole == "admin" ||
                        (userRole == "teamleader" && project.teamLeaders.Contains(userId));

        if (!canCreate)
        {
            throw new UnauthorizedAccessException("Only admin and team leaders can create tasks");
        }

        var taskItem = new TaskItem
        {
            TaskTitle = taskDto.TaskTitle,
            TaskDescription = taskDto.TaskDescription,
            TaskStatus = taskDto.TaskStatus,
            StartDate = taskDto.StartDate,
            EndDate = taskDto.EndDate,
            ProjectId = projectId,
            AssignedUsers = taskDto.AssignedUsers,
            CreatedBy = userId
        };

        var createdTask = await _taskRepository.CreateTask(taskItem);

        // Log task creation activity
        try
        {
            var userName = GetCurrentUserName() ?? "Unknown User";
            await _activityService.LogTaskCreated(createdTask.Id, userId, userName, taskDto.AssignedUsers ?? new List<string>());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log task creation activity: {ex.Message}");
        }

        return createdTask;
    }

    public async Task<TaskItem> UpdateTask(string taskId, UpdateTaskDto taskDto, string userId, string userRole)
    {
        var taskItem = await _taskRepository.GetTaskById(taskId);
        if (taskItem == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        var project = await _projectRepository.GetProjectById(taskItem.ProjectId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found");
        }

        // Check permissions
        bool isAdmin = userRole == "admin";
        bool isTeamLeader = userRole == "teamleader" && project.teamLeaders.Contains(userId);
        bool isAssignedUser = taskItem.AssignedUsers.Contains(userId);

        if (!isAdmin && !isTeamLeader && !isAssignedUser)
        {
            throw new UnauthorizedAccessException("You don't have permission to update this task");
        }

        // Store old values for activity logging
        var oldTask = new
        {
            TaskTitle = taskItem.TaskTitle,
            TaskDescription = taskItem.TaskDescription,
            TaskStatus = taskItem.TaskStatus,
            StartDate = taskItem.StartDate,
            EndDate = taskItem.EndDate,
            AssignedUsers = new List<string>(taskItem.AssignedUsers),
            IsDelete = taskItem.IsDelete
        };

        var userName = GetCurrentUserName() ?? "Unknown User";
        var changes = new Dictionary<string, (object oldValue, object newValue)>();

        // Fields ONLY Admin and Team Leaders can update
        if (isAdmin || isTeamLeader)
        {
            // Title update (admin/TL only)
            if (taskDto.TaskTitle != null && taskDto.TaskTitle != taskItem.TaskTitle)
            {
                changes["TaskTitle"] = (oldTask.TaskTitle, taskDto.TaskTitle);
                taskItem.TaskTitle = taskDto.TaskTitle;
            }

            // Start date update (admin/TL only)
            if (taskDto.StartDate.HasValue && taskDto.StartDate != taskItem.StartDate)
            {
                changes["StartDate"] = (oldTask.StartDate.ToString("yyyy-MM-dd"), taskDto.StartDate.Value.ToString("yyyy-MM-dd"));
                taskItem.StartDate = taskDto.StartDate.Value;
            }

            // Assigned users update (admin/TL only)
            if (taskDto.AssignedUsers != null && !taskDto.AssignedUsers.SequenceEqual(taskItem.AssignedUsers))
            {
                changes["AssignedUsers"] = (string.Join(", ", oldTask.AssignedUsers), string.Join(", ", taskDto.AssignedUsers));

                try
                {
                    await _activityService.LogTaskAssigned(taskId, userId, userName, taskDto.AssignedUsers, oldTask.AssignedUsers);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to log task assignment activity: {ex.Message}");
                }

                taskItem.AssignedUsers = taskDto.AssignedUsers;
            }

            // Delete status update (admin/TL only)
            if (taskDto.IsDelete.HasValue && taskDto.IsDelete != taskItem.IsDelete)
            {
                changes["IsDelete"] = (oldTask.IsDelete, taskDto.IsDelete.Value);
                taskItem.IsDelete = taskDto.IsDelete.Value;
            }
        }

        // Fields that ALL users (including assigned users) can update:

        // Description update - All authorized users can update
        if (taskDto.TaskDescription != null && taskDto.TaskDescription != taskItem.TaskDescription)
        {
            changes["TaskDescription"] = (oldTask.TaskDescription ?? "", taskDto.TaskDescription);
            taskItem.TaskDescription = taskDto.TaskDescription;
        }

        // Status update - All authorized users can update
        if (taskDto.TaskStatus != null && taskDto.TaskStatus != taskItem.TaskStatus)
        {
            changes["TaskStatus"] = (oldTask.TaskStatus, taskDto.TaskStatus);
            taskItem.TaskStatus = taskDto.TaskStatus;
        }

        // End date update - All authorized users can update (for estimated completion)
        if (taskDto.EndDate.HasValue && taskDto.EndDate != taskItem.EndDate)
        {
            changes["EndDate"] = (oldTask.EndDate.ToString("yyyy-MM-dd"), taskDto.EndDate.Value.ToString("yyyy-MM-dd"));
            taskItem.EndDate = taskDto.EndDate.Value;
        }

        // Log activity for changes
        if (changes.Any())
        {
            try
            {
                await _activityService.LogTaskUpdated(taskId, userId, userName, changes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to log task update activity: {ex.Message}");
            }
        }

        taskItem.UpdatedBy = userId;
        taskItem.UpdatedAt = DateTime.UtcNow;

        return await _taskRepository.UpdateTask(taskItem);
    }

    public async Task DeleteTask(string taskId, string userId, string userRole)
    {
        var task = await _taskRepository.GetTaskById(taskId);
        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        var project = await _projectRepository.GetProjectById(task.ProjectId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found");
        }

        // Only admin and team leaders of the project can delete tasks
        bool canDelete = userRole == "admin" ||
                        (userRole == "teamleader" && project.teamLeaders.Contains(userId));

        if (!canDelete)
        {
            throw new UnauthorizedAccessException("Only admin and team leaders can delete tasks");
        }

        await _taskRepository.DeleteTask(taskId);
    }

    // Helper method to get current user name from HTTP context
    private string? GetCurrentUserName()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);
    }
}