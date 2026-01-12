// Updated UserService.cs
using API.DTOs;
using API.Helpers;
using API.Models;
using API.Repositories;
using BCrypt.Net;
using System.Security.Cryptography;
using System.Text;

namespace API.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;
    private readonly JwtHelper _jwt;

    public UserService(IUserRepository repo, JwtHelper jwt)
    {
        _repo = repo;
        _jwt = jwt;
    }

    // Define valid designations
    private readonly string[] ValidDesignations = new[]
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

    public async Task<UserDto?> RegisterAsync(RegisterDto dto, string? creatorId = null)
    {
        var exists = await _repo.GetByEmailAsync(dto.email);
        if (exists != null) return null;

        // Validate role
        var validRoles = new[] { "admin", "teamleader", "user" };
        var userRole = string.IsNullOrEmpty(dto.role) ? "user" : dto.role.ToLower();

        if (!validRoles.Contains(userRole))
        {
            userRole = "user"; // Default to user if invalid role provided
        }

        var userDesignation = string.IsNullOrEmpty(dto.designation) ? "Employee" : dto.designation;

        if (!ValidDesignations.Contains(userDesignation))
        {
            userDesignation = "Employee"; // Default to Employee if invalid
        }

        var user = new User
        {
            name = dto.name,
            email = dto.email,
            password = Hash(dto.password),
            role = userRole,
            designation = userDesignation,
            isActive = true,
            teamLeaderProjects = new List<string>(),
            createdBy = creatorId  // TRACK WHO CREATED THIS USER
        };

        await _repo.CreateAsync(user);

        return new UserDto
        {
            Id = user.Id,
            name = user.name,
            email = user.email,
            role = user.role,
            designation = user.designation,
            isActive = user.isActive,
            token = _jwt.GenerateToken(user),
            teamLeaderProjects = user.teamLeaderProjects,
            createdBy = user.createdBy  // INCLUDE IN RESPONSE
        };
    }
    public async Task<UserDto?> LoginAsync(LoginDto dto)
    {
        var user = await _repo.GetByEmailAsync(dto.email);
        if (user == null || !Verify(dto.password, user.password) || !user.isActive) return null;

        return new UserDto
        {
            Id = user.Id,
            name = user.name,
            email = user.email,
            role = user.role,
            designation = user.designation,
            isActive = user.isActive,
            token = _jwt.GenerateToken(user),
            teamLeaderProjects = user.teamLeaderProjects,
            teamLeaderId = user.teamLeaderId
        };
    }

    public async Task<UserDto?> GetByIdAsync(string id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            name = user.name,
            email = user.email,
            role = user.role,
            designation = user.designation,
            isActive = user.isActive,
            teamLeaderProjects = user.teamLeaderProjects,
            teamLeaderId = user.teamLeaderId
        };
    }

    // Add this missing method - GetByEmailAsync
    public async Task<UserDto?> GetByEmailAsync(string email)
    {
        var user = await _repo.GetByEmailAsync(email);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            name = user.name,
            email = user.email,
            role = user.role,
            designation = user.designation, 
            isActive = user.isActive,
            teamLeaderProjects = user.teamLeaderProjects,
            teamLeaderId = user.teamLeaderId
        };
    }

    public async Task<(List<UserDto> Users, long TotalCount)> GetAllAsync(QueryParametersDto queryParameters)
    {
        var (users, totalCount) = await _repo.GetAllAsync(queryParameters);

        var userDtos = users.Select(u => new UserDto
        {
            Id = u.Id,
            name = u.name,
            email = u.email,
            role = u.role,
            designation = u.designation,
            isActive = u.isActive,
            teamLeaderProjects = u.teamLeaderProjects,
            teamLeaderId = u.teamLeaderId,
            createdBy = u.createdBy  // ADD THIS
        }).ToList();

        return (userDtos, totalCount);
    }
    public async Task<bool> UpdateUserAsync(string id, UpdateUserDto dto)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;

        // Validate role change
        if (!string.IsNullOrEmpty(dto.role))
        {
            var validRoles = new[] { "admin", "teamleader", "user" };
            if (!validRoles.Contains(dto.role.ToLower()))
            {
                return false; // Invalid role
            }

            // If demoting from team leader, clear their team leader projects
            if (user.role == "teamleader" && dto.role != "teamleader")
            {
                user.teamLeaderProjects.Clear();
            }
        }
        if (!string.IsNullOrEmpty(dto.designation) && !ValidDesignations.Contains(dto.designation))
        {
            return false; // Invalid designation
        }

        await _repo.UpdateFieldsAsync(id, dto.name, dto.email, dto.role, dto.designation, dto.isActive);
        return true;
    }

    public async Task<bool> DeleteUserAsync(string id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;
        return await _repo.DeleteAsync(id);
    }

    public async Task<List<UserDto>> GetTeamLeadersAsync()
    {
        var allUsers = await _repo.GetAllAsync();
        var teamLeaders = allUsers.Where(u => u.role == "teamleader" && u.isActive).ToList();

        return teamLeaders.Select(u => new UserDto
        {
            Id = u.Id,
            name = u.name,
            email = u.email,
            role = u.role,
            designation = u.designation,
            isActive = u.isActive,
            teamLeaderProjects = u.teamLeaderProjects
        }).ToList();
    }

    public async Task<List<UserDto>> GetUsersByRoleAsync(string role)
    {
        var allUsers = await _repo.GetAllAsync();
        var filteredUsers = allUsers.Where(u => u.role == role && u.isActive).ToList();

        return filteredUsers.Select(u => new UserDto
        {
            Id = u.Id,
            name = u.name,
            email = u.email,
            role = u.role,
            designation = u.designation,
            isActive = u.isActive,
            teamLeaderProjects = u.teamLeaderProjects,
            teamLeaderId = u.teamLeaderId
        }).ToList();
    }
    public List<string> GetValidDesignations()
    {
        return ValidDesignations.ToList();
    }

    private string Hash(string input) => BCrypt.Net.BCrypt.HashPassword(input);

    private bool Verify(string input, string hash) => BCrypt.Net.BCrypt.Verify(input, hash);
}