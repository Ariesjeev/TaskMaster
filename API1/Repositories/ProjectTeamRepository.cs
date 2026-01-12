//// Repositories/ProjectTeamRepository.cs
//using API.Data;
//using API.Models;
//using MongoDB.Driver;

//namespace API.Repositories;

//public class ProjectTeamRepository : IProjectTeamRepository
//{
//    private readonly MongoDbContext _context;

//    public ProjectTeamRepository(MongoDbContext context) => _context = context;

//    public async Task<ProjectTeam> AddMemberAsync(ProjectTeam member)
//    {
//        await _context.ProjectTeams.InsertOneAsync(member);
//        return member;
//    }

//    public async Task<bool> RemoveMemberAsync(string projectId, string userId)
//    {
//        var result = await _context.ProjectTeams.DeleteOneAsync(pt =>
//            pt.ProjectId == projectId && pt.UserId == userId);
//        return result.DeletedCount > 0;
//    }

//    public async Task<List<ProjectTeam>> GetTeamMembersAsync(string projectId)
//    {
//        return await _context.ProjectTeams.Find(pt => pt.ProjectId == projectId).ToListAsync();
//    }

//    public async Task<List<ProjectTeam>> GetUserProjectsAsync(string userId)
//    {
//        return await _context.ProjectTeams.Find(pt => pt.UserId == userId).ToListAsync();
//    }

//    public async Task<bool> IsMemberAsync(string projectId, string userId)
//    {
//        var count = await _context.ProjectTeams.CountDocumentsAsync(pt =>
//            pt.ProjectId == projectId && pt.UserId == userId);
//        return count > 0;
//    }

//    public async Task<int> GetTeamMemberCountAsync(string projectId)
//    {
//        return (int)await _context.ProjectTeams.CountDocumentsAsync(pt => pt.ProjectId == projectId);
//    }
//}