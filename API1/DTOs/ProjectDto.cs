//using API.Models;

namespace API.DTOs;

// Updated ProjectDto to include team leaders
public class ProjectDto
{
    public string Id { get; set; } = string.Empty;
    public string title { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public string category { get; set; } = string.Empty;
    public string projectStatus { get; set; } = string.Empty;
    public DateTime startDate { get; set; }
    public DateTime endDate { get; set; }
    public bool isDelete { get; set; }
    public List<UserDto> teamLeaders { get; set; } = new(); // New field
    public List<UserDto> assignedUsers { get; set; } = new();
    public string createdBy { get; set; } = string.Empty;
}