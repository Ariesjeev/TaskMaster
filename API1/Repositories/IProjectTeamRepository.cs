//// Repositories/IProjectTeamRepository.cs
//using API.Models;

//namespace API.Repositories;

//public interface IProjectTeamRepository
//{
//    Task<ProjectTeam> AddMemberAsync(ProjectTeam member);
//    Task<bool> RemoveMemberAsync(string projectId, string userId);
//    Task<List<ProjectTeam>> GetTeamMembersAsync(string projectId);
//    Task<List<ProjectTeam>> GetUserProjectsAsync(string userId);
//    Task<bool> IsMemberAsync(string projectId, string userId);
//    Task<int> GetTeamMemberCountAsync(string projectId);
//}