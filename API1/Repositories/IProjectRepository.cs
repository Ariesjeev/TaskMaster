using API.Models;

namespace API.Repositories;

public interface IProjectRepository
{
    Task CreateAsync(Project project);
    Task<Project?> GetByIdAsync(string id);
    Task<List<Project>> GetAllAsync();
    Task<List<Project>> GetByUserAsync(string userId); // Only assigned projects
    Task<Project> GetProjectById(string projectId);
    Task UpdateAsync(Project project);
    Task DeleteAsync(string id);
}
