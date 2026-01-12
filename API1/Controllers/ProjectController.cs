// Updated ProjectController.cs
using API.DTOs;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MongoDB.Bson;

namespace API.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IUserService _userService;

    public ProjectController(IProjectService projectService, IUserService userService)
    {
        _projectService = projectService;
        _userService = userService;
    }

    // Create project - Admin only
    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var project = await _projectService.CreateAsync(dto, userId);
        if (project == null) return BadRequest("Failed to create project.");
        return CreatedAtAction(nameof(GetProjectById), new { id = project.Id }, project);
    }

    // Update project - Admin and Team Leaders
    [Authorize(Roles = "admin,teamleader")]
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProject(string id, [FromBody] UpdateProjectDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (userId == null || role == null) return Unauthorized();

        var updated = await _projectService.UpdateAsync(id, dto, userId, role);
        if (!updated) return NotFound("Project not found or you don't have permission to update.");
        return NoContent();
    }

    // Delete project permanently - Admin only
    [Authorize(Roles = "admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProject(string id)
    {
        var deleted = await _projectService.DeleteAsync(id);
        if (!deleted) return NotFound("Project not found.");
        return NoContent();
    }

    // Get all projects - Filtered by role
    [HttpGet]
    [Authorize]
    public async Task<ActionResult> GetAllProjects(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] bool? isDeleted,
        [FromQuery] string? sortBy,
        [FromQuery] bool? sortDescending,
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 6)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";

        if (userId == null) return Unauthorized();

        var queryParameters = new QueryProjectDto
        {
            Search = search,
            Status = status,
            Category = category,
            IsDeleted = isDeleted,
            SortBy = sortBy,
            SortDescending = sortDescending,
            Page = page,
            PerPage = perPage
        };

        var (projects, totalCount) = await _projectService.GetAllAsync(userId, role, queryParameters);

        var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

        var response = new
        {
            Data = projects,
            Pagination = new
            {
                CurrentPage = page,
                PerPage = perPage,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            }
        };

        return Ok(response);
    }

    // Get project by Id
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ProjectDto>> GetProjectById(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";

        if (userId == null) return Unauthorized();

        var project = await _projectService.GetByIdAsync(id, userId, role);
        if (project == null) return NotFound("Project not found or you don't have access.");
        return Ok(project);
    }

    // Get project users (team leaders and assigned users)
    [HttpGet("{id}/users")]
    [Authorize]
    public async Task<IActionResult> GetProjectUsers(string id)
    {
        if (!ObjectId.TryParse(id, out _))
            return BadRequest(new { message = "Invalid project ID" });

        var users = await _projectService.GetProjectUsersAsync(id);
        if (users == null)
            return NotFound(new { message = "Project not found" });

        return Ok(users);
    }

    // Assign team leaders to project - Admin only
    [HttpPost("{id}/team-leaders")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AssignTeamLeaders(string id, [FromBody] List<string> teamLeaderIds)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var dto = new UpdateProjectDto { teamLeaders = teamLeaderIds };
        var updated = await _projectService.UpdateAsync(id, dto, userId, "admin");

        if (!updated) return NotFound("Project not found.");
        return Ok(new { message = "Team leaders assigned successfully" });
    }

    // Assign users to project - Team Leaders can assign users
    [HttpPost("{id}/assign-users")]
    [Authorize(Roles = "admin,teamleader")]
    public async Task<IActionResult> AssignUsersToProject(string id, [FromBody] List<string> userIds)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (userId == null || role == null) return Unauthorized();

        bool success;
        if (role == "admin")
        {
            var dto = new UpdateProjectDto { assignedUsers = userIds };
            success = await _projectService.UpdateAsync(id, dto, userId, role);
        }
        else
        {
            success = await _projectService.AssignUsersToProjectAsync(id, userIds, userId);
        }

        if (!success) return BadRequest("Failed to assign users. Check permissions and project existence.");
        return Ok(new { message = "Users assigned successfully" });
    }
}