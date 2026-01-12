//// Models/ProjectTeam.cs
//using MongoDB.Bson;
//using MongoDB.Bson.Serialization.Attributes;

//namespace API.Models;

//public class ProjectTeam
//{
//    [BsonId]
//    [BsonRepresentation(BsonType.ObjectId)]
//    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

//    [BsonElement("projectId")]
//    public string ProjectId { get; set; } = string.Empty;

//    [BsonElement("userId")]
//    public string UserId { get; set; } = string.Empty;

//    [BsonElement("addedBy")]
//    public string AddedBy { get; set; } = string.Empty; // Team Leader ID

//    [BsonElement("joinedAt")]
//    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
//}