using API.DTOs;
using API.Helpers;
using API.Models;
using API.Repositories;
using System.Security.Cryptography;
using System.Text;

namespace API.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _repo;
    private readonly IUserRepository _userRepo;

    public ProjectService(IProjectRepository repo, IUserRepository userRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
    }

    public async Task<ProjectDto?> CreateAsync(CreateProjectDto dto, string creatorId)
    {
        // Validate team leaders
        var validTeamLeaders = new List<string>();
        foreach (var userId in dto.teamLeaders)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user != null && user.isActive && (user.role == "teamleader" || user.role == "admin"))
                validTeamLeaders.Add(userId);
        }

        // Validate assigned users
        var validAssignedUsers = new List<string>();
        foreach (var userId in dto.assignedUsers)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user != null && user.isActive)
                validAssignedUsers.Add(userId);
        }

        var project = new Project
        {
            title = dto.title,
            description = dto.description,
            category = dto.category,
            teamLeaders = validTeamLeaders,
            assignedUsers = validAssignedUsers,
            startDate = dto.startDate,
            endDate = dto.endDate,
            projectStatus = "Pending",
            isDelete = false,
            createdBy = creatorId
        };

        await _repo.CreateAsync(project);

        // Update team leaders' teamLeaderProjects field
        foreach (var teamLeaderId in validTeamLeaders)
        {
            var teamLeader = await _userRepo.GetByIdAsync(teamLeaderId);
            if (teamLeader != null)
            {
                teamLeader.teamLeaderProjects.Add(project.Id);
                await _userRepo.UpdateAsync(teamLeader);
            }
        }

        return await ToDto(project);
    }

    // Fixed UpdateAsync method in ProjectService.cs

    // Fixed UpdateAsync method in ProjectService.cs

    public async Task<bool> UpdateAsync(string id, UpdateProjectDto dto, string updaterId, string role)
    {
        var project = await _repo.GetByIdAsync(id);
        if (project == null) return false;

        // Check permissions
        bool isAdmin = role == "admin";
        bool isTeamLeader = role == "teamleader" && project.teamLeaders.Contains(updaterId);

        if (!isAdmin && !isTeamLeader)
        {
            Console.WriteLine($"Access denied: User {updaterId} with role {role} cannot update project {id}");
            return false;
        }

        Console.WriteLine($"Updating project {id} by {role} user {updaterId}");

        // ADMIN can update ALL fields
        if (isAdmin)
        {
            if (!string.IsNullOrEmpty(dto.title))
                project.title = dto.title;

            if (!string.IsNullOrEmpty(dto.category))
                project.category = dto.category;

            if (dto.startDate.HasValue)
                project.startDate = dto.startDate.Value;

            if (dto.isDelete.HasValue)
                project.isDelete = dto.isDelete.Value;

            // Handle team leaders update
            if (dto.teamLeaders != null)
            {
                // Remove project from old team leaders
                foreach (var oldLeaderId in project.teamLeaders.Where(id => !dto.teamLeaders.Contains(id)))
                {
                    var oldLeader = await _userRepo.GetByIdAsync(oldLeaderId);
                    if (oldLeader?.teamLeaderProjects != null)
                    {
                        oldLeader.teamLeaderProjects.Remove(id);
                        await _userRepo.UpdateAsync(oldLeader);
                    }
                }

                // Add project to new team leaders
                var validTeamLeaders = new List<string>();
                foreach (var userId in dto.teamLeaders)
                {
                    var user = await _userRepo.GetByIdAsync(userId);
                    if (user != null && user.isActive && (user.role == "teamleader" || user.role == "admin"))
                    {
                        validTeamLeaders.Add(userId);

                        if (!project.teamLeaders.Contains(userId))
                        {
                            if (user.teamLeaderProjects == null)
                                user.teamLeaderProjects = new List<string>();

                            if (!user.teamLeaderProjects.Contains(id))
                            {
                                user.teamLeaderProjects.Add(id);
                                await _userRepo.UpdateAsync(user);
                            }
                        }
                    }
                }
                project.teamLeaders = validTeamLeaders;
            }
        }

        // BOTH Admin and Team Leader can update these fields
        if (!string.IsNullOrEmpty(dto.description))
        {
            project.description = dto.description;
            Console.WriteLine($"Updated description to: {dto.description.Substring(0, Math.Min(50, dto.description.Length))}...");
        }

        if (!string.IsNullOrEmpty(dto.projectStatus))
        {
            var validStatuses = new[] { "Pending", "In Progress", "Completed" };
            if (validStatuses.Contains(dto.projectStatus))
            {
                project.projectStatus = dto.projectStatus;
                Console.WriteLine($"Updated status to: {dto.projectStatus}");
            }
        }

        if (dto.endDate.HasValue)
        {
            project.endDate = dto.endDate.Value;
            Console.WriteLine($"Updated end date to: {dto.endDate.Value}");
        }

        if (dto.assignedUsers != null)
        {
            var validUsers = new List<string>();
            foreach (var userId in dto.assignedUsers)
            {
                var user = await _userRepo.GetByIdAsync(userId);
                if (user != null && user.isActive)
                {
                    validUsers.Add(userId);
                }
            }
            project.assignedUsers = validUsers;
            Console.WriteLine($"Updated assigned users: {validUsers.Count} users");
        }

        // Update the project
        project.updatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(project);

        Console.WriteLine($"Project {id} successfully updated");
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var project = await _repo.GetByIdAsync(id);
        if (project == null) return false;

        // Remove project from team leaders' lists
        foreach (var teamLeaderId in project.teamLeaders)
        {
            var teamLeader = await _userRepo.GetByIdAsync(teamLeaderId);
            if (teamLeader != null)
            {
                teamLeader.teamLeaderProjects.Remove(id);
                await _userRepo.UpdateAsync(teamLeader);
            }
        }

        await _repo.DeleteAsync(id);
        return true;
    }

    public async Task<ProjectDto?> GetByIdAsync(string id, string requesterId, string role)
    {
        var project = await _repo.GetByIdAsync(id);
        if (project == null) return null;

        // Check access permissions
        bool hasAccess = role == "admin" ||
                        (role == "teamleader" && project.teamLeaders.Contains(requesterId)) ||
                        (project.assignedUsers.Contains(requesterId) && !project.isDelete);

        if (hasAccess)
            return await ToDto(project);

        return null;
    }

    public async Task<(List<ProjectDto> Projects, long TotalCount)> GetAllAsync(string requesterId, string role, QueryProjectDto parameters)
    {
        // Get base query based on user role
        var allProjects = await _repo.GetAllAsync();
        var baseQuery = allProjects.AsQueryable();

        // Filter based on role
        if (role == "teamleader")
        {
            // Team leaders see projects where they are team leaders or assigned users
            baseQuery = baseQuery.Where(p => p.teamLeaders.Contains(requesterId) || p.assignedUsers.Contains(requesterId));
        }
        else if (role == "user")
        {
            // Regular users only see projects they're assigned to
            baseQuery = baseQuery.Where(p => p.assignedUsers.Contains(requesterId));
        }
        // Admin sees all projects

        // Apply search filter
        if (!string.IsNullOrEmpty(parameters.Search))
        {
            baseQuery = baseQuery.Where(p => p.title.ToLower().Contains(parameters.Search.ToLower()));
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(parameters.Status))
        {
            if (parameters.Status == "isDeleted")
            {
                baseQuery = baseQuery.Where(p => p.isDelete);
            }
            else if (parameters.Status == "active")
            {
                baseQuery = baseQuery.Where(p => !p.isDelete);
            }
            else
            {
                baseQuery = baseQuery.Where(p => p.projectStatus == parameters.Status && !p.isDelete);
            }
        }
        else
        {
            if (parameters.IsDeleted.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.isDelete == parameters.IsDeleted.Value);
            }
            else if (role != "admin")
            {
                baseQuery = baseQuery.Where(p => !p.isDelete);
            }
        }

        // Apply category filter
        if (!string.IsNullOrEmpty(parameters.Category))
        {
            baseQuery = baseQuery.Where(p => p.category == parameters.Category);
        }

        // Get total count before pagination
        var totalCount = baseQuery.Count();

        // Apply sorting
        if (!string.IsNullOrEmpty(parameters.SortBy))
        {
            bool desc = parameters.SortDescending ?? false;

            baseQuery = parameters.SortBy.ToLower() switch
            {
                "title" => desc ? baseQuery.OrderByDescending(p => p.title) : baseQuery.OrderBy(p => p.title),
                "startdate" => desc ? baseQuery.OrderByDescending(p => p.startDate) : baseQuery.OrderBy(p => p.startDate),
                "enddate" => desc ? baseQuery.OrderByDescending(p => p.endDate) : baseQuery.OrderBy(p => p.endDate),
                _ => baseQuery.OrderBy(p => p.title)
            };
        }
        else
        {
            baseQuery = baseQuery.OrderBy(p => p.title);
        }

        // Apply pagination
        int skip = (parameters.Page - 1) * parameters.PerPage;
        var projects = baseQuery.Skip(skip).Take(parameters.PerPage).ToList();

        // Convert to DTOs
        var projectDtos = new List<ProjectDto>();
        foreach (var project in projects)
        {
            projectDtos.Add(await ToDto(project));
        }

        return (projectDtos, totalCount);
    }

    public async Task<List<UserDto>?> GetProjectUsersAsync(string id)
    {
        var project = await _repo.GetByIdAsync(id);
        if (project == null) return null;

        // Get both team leaders and assigned users
        var allUserIds = project.teamLeaders.Union(project.assignedUsers).Distinct().ToList();
        var users = await _userRepo.GetByIdsAsync(allUserIds);

        if (users == null || users.Count == 0) return new List<UserDto>();

        return users.Select(u => new UserDto
        {
            Id = u.Id,
            name = u.name,
            email = u.email,
            role = u.role,
            isActive = u.isActive,
            teamLeaderProjects = u.teamLeaderProjects
        }).ToList();
    }

    // New method to assign users to a project by team leader
    public async Task<bool> AssignUsersToProjectAsync(string projectId, List<string> userIds, string teamLeaderId)
    {
        var project = await _repo.GetByIdAsync(projectId);
        if (project == null) return false;

        // Check if requester is a team leader for this project
        if (!project.teamLeaders.Contains(teamLeaderId))
            return false;

        // Validate and add users
        foreach (var userId in userIds)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user != null && user.isActive && !project.assignedUsers.Contains(userId))
            {
                project.assignedUsers.Add(userId);
            }
        }

        await _repo.UpdateAsync(project);
        return true;
    }

    private async Task<ProjectDto> ToDto(Project p)
    {
        // Fetch team leader details
        var teamLeaderUsers = await _userRepo.GetByIdsAsync(p.teamLeaders);
        var teamLeaderDtos = teamLeaderUsers.Select(u => new UserDto
        {
            Id = u.Id,
            name = u.name,
            email = u.email,
            role = u.role,
            isActive = u.isActive
        }).ToList();

        // Fetch assigned user details
        var assignedUsersData = await _userRepo.GetByIdsAsync(p.assignedUsers);
        var userDtos = assignedUsersData.Select(u => new UserDto
        {
            Id = u.Id,
            name = u.name,
            email = u.email,
            role = u.role,
            isActive = u.isActive
        }).ToList();

        return new ProjectDto
        {
            Id = p.Id,
            title = p.title,
            description = p.description,
            category = p.category,
            projectStatus = p.projectStatus,
            startDate = p.startDate,
            endDate = p.endDate,
            isDelete = p.isDelete,
            teamLeaders = teamLeaderDtos,
            assignedUsers = userDtos,
            createdBy = p.createdBy
        };
    }

    public async Task<List<Project>> GetProjectsByTeamLeader(string teamLeaderId)
    {
        // Use the injected repository instead of _projectRepository
        var projects = await _repo.GetAllAsync(); // Changed from _projectRepository to _repo

        return projects.Where(p =>
            p.teamLeaders != null &&
            p.teamLeaders.Contains(teamLeaderId) &&
            !p.isDelete // Don't include deleted projects
        ).ToList();
    }

    // Remove or update this method as it references _context which doesn't exist
    // Option 1: Add this method to your IProjectRepository interface and implement it there
    // Option 2: Remove this method and use GetProjectsByTeamLeader instead

    // If you want to keep it, move it to ProjectRepository.cs:
    // In ProjectRepository.cs, add:
   
}