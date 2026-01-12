// Updated IProjectService.cs
using API.DTOs;
using API.Models;

namespace API.Services;

public interface IProjectService
{
    Task<ProjectDto?> CreateAsync(CreateProjectDto dto, string creatorId);
    Task<bool> UpdateAsync(string id, UpdateProjectDto dto, string updaterId, string role);
    Task<bool> DeleteAsync(string id);
    Task<ProjectDto?> GetByIdAsync(string id, string requesterId, string role);
    Task<(List<ProjectDto> Projects, long TotalCount)> GetAllAsync(string requesterId, string role, QueryProjectDto queryParameters);
    Task<List<UserDto>?> GetProjectUsersAsync(string id);
    Task<bool> AssignUsersToProjectAsync(string projectId, List<string> userIds, string teamLeaderId);
    Task<List<Project>> GetProjectsByTeamLeader(string teamLeaderId);
    //Task GetProjectById(object projectId);
}