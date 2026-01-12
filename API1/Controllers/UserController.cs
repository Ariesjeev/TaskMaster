// Updated UserController.cs
using API.DTOs;
using API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly IUserService _service;
    private readonly IProjectService _projectService;

   // public UserController(IUserService service) => _service = service;
    public UserController(IUserService service, IProjectService projectService)
    {
        _service = service;
        _projectService = projectService; // Initialize it
    }


    // Public registration endpoint (for initial registration only)
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var user = await _service.RegisterAsync(dto);
        return user == null ? BadRequest("User already exists") : Ok(user);
    }

    // NEW: Authenticated endpoint for Team Leaders and Admins to create users
    // UserController.cs - Fixed CreateUser method
    [HttpPost("create")]
    [Authorize(Roles = "admin,teamleader")]
    public async Task<IActionResult> CreateUser(RegisterDto dto)
    {
        // Get the current user's ID and role
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Team Leaders can only create regular users
        if (currentUserRole == "teamleader" && dto.role != "user")
        {
            return Forbid("Team Leaders can only create regular users");
        }

        // Pass the creator's ID to track who created this user
        var user = await _service.RegisterAsync(dto, currentUserId);

        if (user == null)
        {
            return BadRequest(new { message = "User already exists" });
        }

        return Ok(user);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _service.LoginAsync(dto);
        return user == null ? Unauthorized("Invalid credentials") : Ok(user);
    }

    // Allow both admin and teamleader to view users
    // Updated UserController.cs - GetAll method with project-based filtering


    [HttpGet("designations")]
    [Authorize]
    public async Task<IActionResult> GetDesignations()
    {
        var designations = new[]
        {
        "Employee",
        "Senior Developer",
        "Junior Developer",
        "Project Manager",
        "Team Lead",
        "Business Analyst",
        "QA Engineer",
        "DevOps Engineer",
        "UI/UX Designer",
        "Data Analyst",
        "Product Owner",
        "Scrum Master",
        "Technical Lead",
        "Architect",
        "Intern"
    };

        return Ok(designations);
    }
    // Fixed GetAll method in UserController.cs

    [HttpGet]
    [Authorize(Roles = "admin,teamleader")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? role,
         [FromQuery] string? designation,
        [FromQuery] bool? isActive,
        [FromQuery] string? sortBy,
        [FromQuery] bool? sortDescending,
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 10)
    {
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var queryParameters = new QueryParametersDto
        {
            Search = search,
            Role = role,
            Designation = designation,
            IsActive = isActive,
            SortBy = sortBy,
            SortDescending = sortDescending,
            Page = page,
            PerPage = perPage
        };

        // Get all users first
        var (allUsers, totalCount) = await _service.GetAllAsync(queryParameters);

        // If Team Leader, filter to only show relevant users
        if (currentUserRole == "teamleader")
        {
            // Get all projects where this team leader is assigned
            var teamLeaderProjects = await _projectService.GetProjectsByTeamLeader(currentUserId);

            // Extract all user IDs from these projects
            var relevantUserIds = new HashSet<string>();

            foreach (var project in teamLeaderProjects)
            {
                // Add team leaders of the project
                if (project.teamLeaders != null)
                {
                    foreach (var tlId in project.teamLeaders)
                    {
                        relevantUserIds.Add(tlId);
                    }
                }

                // Add assigned users of the project
                if (project.assignedUsers != null)
                {
                    foreach (var userId in project.assignedUsers)
                    {
                        relevantUserIds.Add(userId);
                    }
                }

                // Add project creator
                if (!string.IsNullOrEmpty(project.createdBy))
                {
                    relevantUserIds.Add(project.createdBy);
                }
            }

            // IMPORTANT: Add ALL users created by this Team Leader
            var allUsersCreatedByTL = allUsers.Where(u => u.createdBy == currentUserId).Select(u => u.Id);
            foreach (var userId in allUsersCreatedByTL)
            {
                relevantUserIds.Add(userId);
            }

            // Add admins (Team Leaders should see admins)
            var admins = allUsers.Where(u => u.role == "admin").Select(u => u.Id);
            foreach (var adminId in admins)
            {
                relevantUserIds.Add(adminId);
            }

            // Add the team leader themselves
            relevantUserIds.Add(currentUserId);

            // Filter users to only those relevant to the team leader
            allUsers = allUsers.Where(u => relevantUserIds.Contains(u.Id)).ToList();
            totalCount = allUsers.Count;
        }

        // Apply pagination after filtering
        var paginatedUsers = allUsers
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .ToList();

        // Calculate total pages
        var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

        // IMPORTANT: Return in the correct format expected by frontend
        var response = new
        {
            Data = paginatedUsers,  // Capital D
            Pagination = new        // Capital P
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

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,teamleader")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserDto dto)
    {
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Get the user being updated
        var targetUser = await _service.GetByIdAsync(id);
        if (targetUser == null) return NotFound("User not found");

        // Team Leaders can only update regular users
        if (currentUserRole == "teamleader")
        {
            if (targetUser.role != "user")
            {
                return Forbid("Team Leaders can only modify regular users");
            }

            // Team Leaders cannot change roles
            if (dto.role != null && dto.role != "user")
            {
                return Forbid("Team Leaders cannot change user roles");
            }
        }

        var updated = await _service.UpdateUserAsync(id, dto);
        if (!updated) return NotFound("User not found");
        return Ok("User updated successfully");
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin,teamleader")]
    public async Task<IActionResult> Delete(string id)
    {
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Get the user being deleted
        var targetUser = await _service.GetByIdAsync(id);
        if (targetUser == null) return NotFound("User not found");

        // Team Leaders can only delete regular users
        if (currentUserRole == "teamleader" && targetUser.role != "user")
        {
            return Forbid("Team Leaders can only delete regular users");
        }

        var success = await _service.DeleteUserAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("team-leaders")]
    [Authorize]
    public async Task<IActionResult> GetTeamLeaders()
    {
        var teamLeaders = await _service.GetTeamLeadersAsync();
        return Ok(teamLeaders);
    }

    [HttpGet("by-role/{role}")]
    [Authorize]
    public async Task<IActionResult> GetUsersByRole(string role)
    {
        var users = await _service.GetUsersByRoleAsync(role);
        return Ok(users);
    }
}