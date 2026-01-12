using API.Models;

namespace API.Repositories
{
    public interface ITaskActivityRepository
    {
        Task<IEnumerable<TaskActivity>> GetActivitiesByTaskId(string taskId);
        Task<TaskActivity> CreateActivity(TaskActivity activity);
        Task<bool> DeleteActivitiesByTaskId(string taskId);
    }
}