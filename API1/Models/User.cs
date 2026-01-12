using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("name")]
    public string name { get; set; } = string.Empty;

    [BsonElement("email")]
    public string email { get; set; } = string.Empty;

    [BsonElement("password")]
    public string password { get; set; } = string.Empty;

    [BsonElement("role")]
    public string role { get; set; } = "user"; // "admin", "teamleader", or "user"

    [BsonElement("designation")]
    public string designation { get; set; } = "Employee"; // Default designation

    [BsonElement("isActive")]
    public bool isActive { get; set; } = true;

    [BsonElement("createdAt")]
    public DateTime createdAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime updatedAt { get; set; } = DateTime.UtcNow;

    // New field: Projects where user is a team leader
    [BsonElement("teamLeaderProjects")]
    public List<string> teamLeaderProjects { get; set; } = new();

    // New field: Team leader ID for regular users (who is their team leader)
    [BsonElement("teamLeaderId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? teamLeaderId { get; set; }

    public string? createdBy { get; set; }
}