using API.Models;
using MongoDB.Driver;

namespace API.Repositories;

public interface ITaskRepository
{
    Task<IEnumerable<TaskItem>> GetTasksForProject(string projectId, string userId, bool isAdmin);
    Task<TaskItem> GetTaskById(string taskId);
    Task<TaskItem> CreateTask(TaskItem taskItem);
    Task<TaskItem> UpdateTask(TaskItem taskItem);
    Task DeleteTask(string taskId);
    // Task<IEnumerable<TaskItem>> GetTasksByUserId(string userId);

}