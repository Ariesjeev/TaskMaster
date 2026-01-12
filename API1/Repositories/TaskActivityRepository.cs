/*
using API.Data;
using API.Models;
using MongoDB.Driver;

namespace API.Repositories
{
    public class TaskActivityRepository : ITaskActivityRepository
    {
        private readonly MongoDbContext _context;

        public TaskActivityRepository(MongoDbContext context)
        {
            _context = context;
        }

        public async Task<TaskActivity> CreateActivity(TaskActivity activity)
        {
            await _context.TaskActivities.InsertOneAsync(activity);
            return activity;
        }

        public async Task<IEnumerable<TaskActivity>> GetTaskActivities(string taskId)
        {
            return await _context.TaskActivities
                .Find(a => a.TaskId == taskId && !a.IsDeleted)
                .SortByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskActivity> GetActivityById(string activityId)
        {
            return await _context.TaskActivities
                .Find(a => a.Id == activityId && !a.IsDeleted)
                .FirstOrDefaultAsync();
        }

        public async Task DeleteActivity(string activityId)
        {
            var update = Builders<TaskActivity>.Update
                .Set(a => a.IsDeleted, true);
            
            await _context.TaskActivities.UpdateOneAsync(a => a.Id == activityId, update);
        }
    }
}*/
using API.Data;
using API.Models;
using MongoDB.Driver;

namespace API.Repositories
{
    public class TaskActivityRepository : ITaskActivityRepository
    {
        private readonly MongoDbContext _context;

        public TaskActivityRepository(MongoDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TaskActivity>> GetActivitiesByTaskId(string taskId)
        {
            return await _context.TaskActivities
                .Find(a => a.TaskId == taskId)
                .SortByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskActivity> CreateActivity(TaskActivity activity)
        {
            await _context.TaskActivities.InsertOneAsync(activity);
            return activity;
        }

        public async Task<bool> DeleteActivitiesByTaskId(string taskId)
        {
            var result = await _context.TaskActivities.DeleteManyAsync(a => a.TaskId == taskId);
            return result.DeletedCount > 0;
        }
    }
}