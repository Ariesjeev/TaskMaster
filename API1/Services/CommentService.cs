// Fixed CommentService.cs with better TL access handling

using API.DTOs;
using API.Models;
using API.Repositories;
using static API.DTOs.CommentDto;

namespace API.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly ITaskActivityService _activityService;

    public CommentService(
        ICommentRepository commentRepository,
        ITaskRepository taskRepository,
        IProjectRepository projectRepository,
        ITaskActivityService activityService)
    {
        _commentRepository = commentRepository;
        _taskRepository = taskRepository;
        _projectRepository = projectRepository;
        _activityService = activityService;
    }

    public async Task<IEnumerable<CommentResponseDto>> GetTaskComments(string taskId, string userId, bool hasElevatedAccess)
    {
        // First, check if task exists
        var task = await _taskRepository.GetTaskById(taskId);
        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        // Get the project
        var project = await _projectRepository.GetProjectById(task.ProjectId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found");
        }

        // Check access: admin, teamleader of the project, or assigned user
        bool hasAccess = hasElevatedAccess ||
                         project.createdBy == userId ||
                         project.assignedUsers.Contains(userId) ||
                         project.teamLeaders.Contains(userId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("You don't have access to view comments for this task");
        }

        var comments = await _commentRepository.GetCommentsByTaskId(taskId);

        return comments.Select(c => new CommentResponseDto
        {
            Id = c.Id,
            Content = c.Content,
            CreatedBy = c.CreatedBy,
            CreatedByName = c.CreatedByName,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            CanEdit = hasElevatedAccess || c.CreatedBy == userId,
            CanDelete = hasElevatedAccess || c.CreatedBy == userId
        });
    }

    public async Task<CommentResponseDto> CreateComment(string taskId, CreateCommentDto commentDto, string userId, string userName)
    {
        // Check if task exists
        var task = await _taskRepository.GetTaskById(taskId);
        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        // Check if user has access to the project
        var project = await _projectRepository.GetProjectById(task.ProjectId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found");
        }

        // Allow if: admin, team leader of project, creator, or assigned user
        bool hasAccess = project.createdBy == userId ||
                         project.assignedUsers.Contains(userId) ||
                         project.teamLeaders.Contains(userId);

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException($"You don't have access to comment on this task. User {userId} not in project.");
        }

        var comment = new Comment
        {
            TaskId = taskId,
            Content = commentDto.Content.Trim(),
            CreatedBy = userId,
            CreatedByName = userName,
            CreatedAt = DateTime.UtcNow
        };

        var createdComment = await _commentRepository.CreateComment(comment);

        // Log the comment activity
        try
        {
            await _activityService.LogComment(taskId, commentDto.Content.Trim(), userId, userName);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log comment activity: {ex.Message}");
        }

        return new CommentResponseDto
        {
            Id = createdComment.Id,
            Content = createdComment.Content,
            CreatedBy = createdComment.CreatedBy,
            CreatedByName = createdComment.CreatedByName,
            CreatedAt = createdComment.CreatedAt,
            UpdatedAt = createdComment.UpdatedAt,
            CanEdit = true,
            CanDelete = true
        };
    }

    public async Task<CommentResponseDto> UpdateComment(string commentId, UpdateCommentDto commentDto, string userId, bool hasElevatedAccess)
    {
        var comment = await _commentRepository.GetCommentById(commentId);
        if (comment == null)
        {
            throw new KeyNotFoundException("Comment not found");
        }

        // Only the comment creator or elevated users can update
        if (!hasElevatedAccess && comment.CreatedBy != userId)
        {
            throw new UnauthorizedAccessException("You can only edit your own comments");
        }

        // Store old content for activity logging
        var oldContent = comment.Content;
        comment.Content = commentDto.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;

        var updatedComment = await _commentRepository.UpdateComment(comment);

        // Log the comment update activity
        try
        {
            await _activityService.LogCommentUpdate(
                comment.TaskId,
                oldContent,
                commentDto.Content.Trim(),
                userId,
                comment.CreatedByName
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log comment update activity: {ex.Message}");
        }

        return new CommentResponseDto
        {
            Id = updatedComment.Id,
            Content = updatedComment.Content,
            CreatedBy = updatedComment.CreatedBy,
            CreatedByName = updatedComment.CreatedByName,
            CreatedAt = updatedComment.CreatedAt,
            UpdatedAt = updatedComment.UpdatedAt,
            CanEdit = hasElevatedAccess || updatedComment.CreatedBy == userId,
            CanDelete = hasElevatedAccess || updatedComment.CreatedBy == userId
        };
    }

    public async Task DeleteComment(string commentId, string userId, bool hasElevatedAccess)
    {
        var comment = await _commentRepository.GetCommentById(commentId);
        if (comment == null)
        {
            throw new KeyNotFoundException("Comment not found");
        }

        // Only the comment creator or elevated users can delete
        if (!hasElevatedAccess && comment.CreatedBy != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own comments");
        }

        // Log the comment deletion activity
        try
        {
            await _activityService.LogCommentDelete(
                comment.TaskId,
                comment.Content,
                userId,
                comment.CreatedByName
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log comment deletion activity: {ex.Message}");
        }

        await _commentRepository.DeleteComment(commentId);
    }
}