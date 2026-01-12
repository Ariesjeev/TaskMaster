//// Models/ProjectTask.cs
//using MongoDB.Bson;
//using MongoDB.Bson.Serialization.Attributes;

//namespace API.Models;

//public class ProjectTask
//{
//    [BsonId]
//    [BsonRepresentation(BsonType.ObjectId)]
//    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

//    [BsonElement("title")]
//    public string Title { get; set; } = string.Empty;

//    [BsonElement("description")]
//    public string Description { get; set; } = string.Empty;

//    [BsonElement("projectId")]
//    public string ProjectId { get; set; } = string.Empty;

//    [BsonElement("assignedToUserId")]
//    public string? AssignedToUserId { get; set; }

//    [BsonElement("assignedByLeaderId")]
//    public string AssignedByLeaderId { get; set; } = string.Empty; // Team Leader ID

//    [BsonElement("status")]
//    public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed, Blocked

//    [BsonElement("priority")]
//    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical

//    [BsonElement("dueDate")]
//    public DateTime? DueDate { get; set; }

//    [BsonElement("createdAt")]
//    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

//    [BsonElement("updatedAt")]
//    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
//}