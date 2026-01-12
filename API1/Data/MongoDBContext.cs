using API.Models;
using API.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace API.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _db;

    public MongoDbContext(IOptions<MongoDBSettings> options)
    {
        var client = new MongoClient(options.Value.ConnectionString);
        _db = client.GetDatabase(options.Value.DatabaseName);
    }

    public IMongoCollection<User> Users => _db.GetCollection<User>("Users");
    public IMongoCollection<Project> Projects => _db.GetCollection<Project>("Projects");
    public IMongoCollection<TaskItem> Tasks => _db.GetCollection<TaskItem>("Tasks");

    public IMongoCollection<Comment> Comments => _db.GetCollection<Comment>("comments"); // Add this line
    //public IMongoCollection<TaskActivity> TaskActivities => _db.GetCollection<TaskActivity>("taskactivities");
    public IMongoCollection<TaskActivity> TaskActivities => _db.GetCollection<TaskActivity>("taskactivities");

    //public IMongoCollection<TaskActivity> TaskActivities => _db.GetCollection<TaskActivity>("task_activities");

    // public IMongoCollection<TaskActivity> TaskActivities => _db.GetCollection<TaskActivity>("taskactivities");

}



