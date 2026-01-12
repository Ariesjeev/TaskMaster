// Fixed CommentsController.cs with proper TL permissions

using API.DTOs;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using static API.DTOs.CommentDto;

namespace API.Controllers;

[ApiController]
[Route("api/tasks/{taskId}/comments")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly IUserService _userService;

    public CommentsController(ICommentService commentService, IUserService userService)
    {
        _commentService = commentService;
        _userService = userService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetTaskComments(string taskId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Treat teamleader as having elevated permissions
        var hasElevatedAccess = User.IsInRole("admin") ||
                                User.IsInRole("teamleader") ||
                                User.IsInRole("TL");

        try
        {
            var comments = await _commentService.GetTaskComments(taskId, userId, hasElevatedAccess);
            return Ok(comments);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetTaskComments: {ex.Message}");
            return StatusCode(500, new { message = "Failed to fetch comments" });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateComment(string taskId, [FromBody] CreateCommentDto commentDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown User";
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(commentDto.Content))
        {
            return BadRequest("Comment content is required");
        }

        try
        {
            Console.WriteLine($"Creating comment - User: {userName}, Role: {userRole}, TaskId: {taskId}");

            var comment = await _commentService.CreateComment(taskId, commentDto, userId, userName);
            return CreatedAtAction(nameof(GetTaskComments), new { taskId }, comment);
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"Unauthorized: {ex.Message}");
            return Forbid(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating comment: {ex.Message}");
            return StatusCode(500, new { message = "Failed to create comment" });
        }
    }

    [HttpPut("{commentId}")]
    [Authorize]
    public async Task<IActionResult> UpdateComment(string taskId, string commentId, [FromBody] UpdateCommentDto commentDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(commentDto.Content))
        {
            return BadRequest("Comment content is required");
        }

        var hasElevatedAccess = User.IsInRole("admin") ||
                                User.IsInRole("teamleader") ||
                                User.IsInRole("TL");

        try
        {
            var comment = await _commentService.UpdateComment(commentId, commentDto, userId, hasElevatedAccess);
            return Ok(comment);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating comment: {ex.Message}");
            return StatusCode(500, new { message = "Failed to update comment" });
        }
    }

    [HttpDelete("{commentId}")]
    [Authorize]
    public async Task<IActionResult> DeleteComment(string taskId, string commentId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var hasElevatedAccess = User.IsInRole("admin") ||
                                User.IsInRole("teamleader") ||
                                User.IsInRole("TL");

        try
        {
            await _commentService.DeleteComment(commentId, userId, hasElevatedAccess);
            return Ok(new { message = "Comment deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting comment: {ex.Message}");
            return StatusCode(500, new { message = "Failed to delete comment" });
        }
    }
}