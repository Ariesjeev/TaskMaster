namespace API.DTOs;

// Updated UserDto to include team leader info
public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public string email { get; set; } = string.Empty;
    public string role { get; set; } = string.Empty;
    public string designation { get; set; } = string.Empty;
    public bool isActive { get; set; }
    public string? token { get; set; }
    public List<string> teamLeaderProjects { get; set; } = new(); // New field
    public string? teamLeaderId { get; set; } // New field
    //public string createdBy { get; internal set; }
    public string? createdBy { get; set; }
}