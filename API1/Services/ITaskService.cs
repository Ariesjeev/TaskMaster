// Updated ITaskService.cs
using API.DTOs;
using API.Models;

namespace API.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskItem>> GetTasks(string projectId, string userId, string userRole);
    Task<TaskItem> GetTask(string taskId);
    Task<TaskItem> CreateTask(CreateTaskDto taskDto, string projectId, string userId, string userRole);
    Task<TaskItem> UpdateTask(string taskId, UpdateTaskDto taskDto, string userId, string userRole);
    Task DeleteTask(string taskId, string userId, string userRole);
    //Task GetTaskById(string id);
}