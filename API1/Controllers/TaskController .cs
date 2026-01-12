// Updated TasksController.cs
using API.DTOs;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly IProjectService _projectService;

    public TasksController(ITaskService taskService, IProjectService projectService)
    {
        _taskService = taskService;
        _projectService = projectService;
    }

    // Get tasks for a project
    [HttpGet("{projectId}")]
    [Authorize]
    public async Task<IActionResult> GetTasks(string projectId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "user";

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var tasks = await _taskService.GetTasks(projectId, userId, userRole);
            return Ok(tasks);
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
            return BadRequest(ex.Message);
        }
    }

    // Create task - Admin and Team Leaders only
    [Authorize(Roles = "admin,teamleader")]
    [HttpPost("{projectId}")]
    public async Task<IActionResult> CreateTask(string projectId, [FromBody] CreateTaskDto taskDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userRole))
        {
            return Unauthorized();
        }

        if (string.IsNullOrEmpty(taskDto.TaskTitle))
        {
            return BadRequest("Task title is required");
        }

        try
        {
            var taskItem = await _taskService.CreateTask(taskDto, projectId, userId, userRole);
            return CreatedAtAction(nameof(GetTasks), new { projectId }, taskItem);
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
            return BadRequest(ex.Message);
        }
    }

    // Update task - Admin, Team Leaders, and assigned users
    [HttpPut("{taskId}")]
    [Authorize]
    public async Task<IActionResult> UpdateTask(string taskId, [FromBody] UpdateTaskDto taskDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "user";

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var taskItem = await _taskService.UpdateTask(taskId, taskDto, userId, userRole);
            return Ok(taskItem);
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
            return BadRequest(ex.Message);
        }
    }

    // Delete task - Admin and Team Leaders only
    [Authorize(Roles = "admin,teamleader")]
    [HttpDelete("{taskId}")]
    public async Task<IActionResult> DeleteTask(string taskId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userRole))
        {
            return Unauthorized();
        }

        try
        {
            await _taskService.DeleteTask(taskId, userId, userRole);
            return Ok(new { message = "Task permanently deleted" });
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
            return BadRequest(ex.Message);
        }
    }
}