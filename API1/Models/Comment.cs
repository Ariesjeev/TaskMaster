using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace API.Models
{
    public class Comment
    {

        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        public string TaskId { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public string CreatedByName { get; set; } = string.Empty; // To store user's name for display
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}



// 1. Comment Model (Add to API.Models namespace)
//using MongoDB.Bson;
//using MongoDB.Bson.Serialization.Attributes;

//namespace API.Models;

//public class Comment
//{
//    [BsonId]
//    [BsonRepresentation(BsonType.ObjectId)]
//    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

//    public string TaskId { get; set; } = string.Empty;
//    public string Content { get; set; } = string.Empty;
//    public string CreatedBy { get; set; } = string.Empty;
//    public string CreatedByName { get; set; } = string.Empty; // To store user's name for display
//    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
//    public DateTime? UpdatedAt { get; set; }
//    public bool IsDeleted { get; set; } = false;
//}
