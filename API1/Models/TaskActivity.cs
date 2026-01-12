using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API.Models
{
    public class TaskActivity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        public string TaskId { get; set; } = string.Empty;
        public string ActivityType { get; set; } = string.Empty; // "task_created", "task_updated", "task_assigned", "comment_added", etc.
        public string Description { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // For storing additional data like field changes
        public Dictionary<string, object>? Metadata { get; set; }
    }
}