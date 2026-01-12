using API.Models;
using API.Data;
using MongoDB.Driver;

namespace API.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly MongoDbContext _context;

    public TaskRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TaskItem>> GetTasksForProject(string projectId, string userId, bool isAdmin)
    {
        var filter = Builders<TaskItem>.Filter.Eq(t => t.ProjectId, projectId);
        
        if (!isAdmin)
        {
            filter &= Builders<TaskItem>.Filter.Eq(t => t.IsDelete, false);
            filter &= Builders<TaskItem>.Filter.AnyEq(t => t.AssignedUsers, userId);
        }

        return await _context.Tasks.Find(filter)
            .ToListAsync();
    }

    public async Task<TaskItem> GetTaskById(string taskId)
    {
        return await _context.Tasks.Find(t => t.Id == taskId).FirstOrDefaultAsync();
    }

    public async Task<TaskItem> CreateTask(TaskItem taskItem)
    {
        await _context.Tasks.InsertOneAsync(taskItem);
        return taskItem;
    }

    public async Task<TaskItem> UpdateTask(TaskItem taskItem)
    {
        taskItem.UpdatedAt = DateTime.UtcNow;
        await _context.Tasks.ReplaceOneAsync(t => t.Id == taskItem.Id, taskItem);
        return taskItem;
    }

    public async Task DeleteTask(string taskId)
    {
        await _context.Tasks.DeleteOneAsync(t => t.Id == taskId);
    }
}