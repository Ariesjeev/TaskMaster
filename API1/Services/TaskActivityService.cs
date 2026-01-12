using API.DTOs;
using API.Models;
using API.Repositories;
using static API.DTOs.TaskActivityDto;

namespace API.Services
{
    public class TaskActivityService : ITaskActivityService
    {
        private readonly ITaskActivityRepository _activityRepository;
        private readonly ITaskRepository _taskRepository;
        private readonly IProjectRepository _projectRepository;

        public TaskActivityService(
            ITaskActivityRepository activityRepository,
            ITaskRepository taskRepository,
            IProjectRepository projectRepository)
        {
            _activityRepository = activityRepository;
            _taskRepository = taskRepository;
            _projectRepository = projectRepository;
        }

        public async Task<IEnumerable<TaskActivityResponseDto>> GetTaskActivities(string taskId, string userId, bool isAdmin)
        {
            // Check if user has access to the task
            var task = await _taskRepository.GetTaskById(taskId);
            if (task == null)
            {
                throw new KeyNotFoundException("Task not found");
            }

            // Check if user has access to the project containing this task
            var project = await _projectRepository.GetProjectById(task.ProjectId);
            //if (project == null || (!isAdmin && project.createdBy != userId && !project.assignedUsers.Contains(userId)))
            //{
            //    throw new UnauthorizedAccessException("You don't have access to this task");
            //}

            if (project == null)
            {
                throw new KeyNotFoundException("Project not found");
            }


            bool hasAccess = isAdmin ||
                          project.createdBy == userId ||
                          project.assignedUsers.Contains(userId) ||
                          project.teamLeaders.Contains(userId); // Added team leader check

            if (!hasAccess)
            {
                throw new UnauthorizedAccessException("You don't have access to this task");
            }

            var activities = await _activityRepository.GetActivitiesByTaskId(taskId);

            return activities.Select(a => new TaskActivityResponseDto
            {
                Id = a.Id,
                ActivityType = a.ActivityType,
                Description = a.Description,
                UserId = a.UserId,
                UserName = a.UserName,
                CreatedAt = a.CreatedAt,
                Metadata = a.Metadata
            });
        }

        public async Task LogTaskCreated(string taskId, string createdBy, string createdByName, List<string> assignedUsers)
        {
            var activity = new TaskActivity
            {
                TaskId = taskId,
                ActivityType = "task_created",
                Description = $"Task created by {createdByName}",
                UserId = createdBy,
                UserName = createdByName,
                Metadata = new Dictionary<string, object>
                {
                    ["assignedUsers"] = assignedUsers
                }
            };

            await _activityRepository.CreateActivity(activity);

            // Log assignments if there are any
            if (assignedUsers?.Any() == true)
            {
                await LogTaskAssigned(taskId, createdBy, createdByName, assignedUsers, new List<string>());
            }
        }

        public async Task LogTaskUpdated(string taskId, string updatedBy, string updatedByName, Dictionary<string, (object oldValue, object newValue)> changes)
        {
            foreach (var change in changes)
            {
                var fieldName = GetFriendlyFieldName(change.Key);
                var description = $"{updatedByName} updated {fieldName} from \"{change.Value.oldValue}\" to \"{change.Value.newValue}\"";

                var activity = new TaskActivity
                {
                    TaskId = taskId,
                    ActivityType = "task_updated",
                    Description = description,
                    UserId = updatedBy,
                    UserName = updatedByName,
                    Metadata = new Dictionary<string, object>
                    {
                        ["field"] = change.Key,
                        ["oldValue"] = change.Value.oldValue,
                        ["newValue"] = change.Value.newValue
                    }
                };

                await _activityRepository.CreateActivity(activity);
            }
        }

        public async Task LogTaskAssigned(string taskId, string assignedBy, string assignedByName, List<string> newAssignedUsers, List<string> oldAssignedUsers)
        {
            // Find users who were added
            var addedUsers = newAssignedUsers.Except(oldAssignedUsers).ToList();
            // Find users who were removed
            var removedUsers = oldAssignedUsers.Except(newAssignedUsers).ToList();

            if (addedUsers.Any())
            {
                var activity = new TaskActivity
                {
                    TaskId = taskId,
                    ActivityType = "task_assigned",
                    Description = $"{assignedByName} assigned task to {string.Join(", ", addedUsers)}",
                    UserId = assignedBy,
                    UserName = assignedByName,
                    Metadata = new Dictionary<string, object>
                    {
                        ["addedUsers"] = addedUsers
                    }
                };

                await _activityRepository.CreateActivity(activity);
            }

            if (removedUsers.Any())
            {
                var activity = new TaskActivity
                {
                    TaskId = taskId,
                    ActivityType = "task_unassigned",
                    Description = $"{assignedByName} unassigned {string.Join(", ", removedUsers)} from task",
                    UserId = assignedBy,
                    UserName = assignedByName,
                    Metadata = new Dictionary<string, object>
                    {
                        ["removedUsers"] = removedUsers
                    }
                };

                await _activityRepository.CreateActivity(activity);
            }
        }

        public async Task LogComment(string taskId, string comment, string userId, string userName)
        {
            var description = comment.Contains("updated comment") || comment.Contains("deleted a comment")
                ? $"{userName} {comment}"
                : $"{userName} added a comment: \"{comment.Substring(0, Math.Min(50, comment.Length))}{(comment.Length > 50 ? "..." : "")}\"";

            var activity = new TaskActivity
            {
                TaskId = taskId,
                ActivityType = "comment_added",
                Description = description,
                UserId = userId,
                UserName = userName,
                Metadata = new Dictionary<string, object>
                {
                    ["comment"] = comment
                }
            };

            await _activityRepository.CreateActivity(activity);
        }

        // ADD THIS METHOD - Log comment update
        public async Task LogCommentUpdate(string taskId, string oldComment, string newComment, string userId, string userName)
        {
            var description = $"{userName} updated a comment";

            var activity = new TaskActivity
            {
                TaskId = taskId,
                ActivityType = "comment_updated",
                Description = description,
                UserId = userId,
                UserName = userName,
                Metadata = new Dictionary<string, object>
                {
                    ["oldComment"] = oldComment.Substring(0, Math.Min(50, oldComment.Length)) + (oldComment.Length > 50 ? "..." : ""),
                    ["newComment"] = newComment.Substring(0, Math.Min(50, newComment.Length)) + (newComment.Length > 50 ? "..." : "")
                }
            };

            await _activityRepository.CreateActivity(activity);
        }

        // ADD THIS METHOD - Log comment deletion
        public async Task LogCommentDelete(string taskId, string comment, string userId, string userName)
        {
            var description = $"{userName} deleted a comment: \"{comment.Substring(0, Math.Min(50, comment.Length))}{(comment.Length > 50 ? "..." : "")}\"";

            var activity = new TaskActivity
            {
                TaskId = taskId,
                ActivityType = "comment_deleted",
                Description = description,
                UserId = userId,
                UserName = userName,
                Metadata = new Dictionary<string, object>
                {
                    ["deletedComment"] = comment
                }
            };

            await _activityRepository.CreateActivity(activity);
        }


        private string GetFriendlyFieldName(string fieldName)
        {
            return fieldName switch
            {
                "TaskTitle" => "title",
                "TaskDescription" => "description",
                "TaskStatus" => "status",
                "StartDate" => "start date",
                "EndDate" => "end date",
                "AssignedUsers" => "assigned users",
                "IsDelete" => "delete status",
                _ => fieldName.ToLower()
            };
        }
    }
}