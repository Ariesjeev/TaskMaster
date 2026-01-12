namespace API.DTOs;

public class TaskDto
{
    public string Id { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
    public string TaskDescription { get; set; } = string.Empty;
    public string TaskStatus { get; set; } = "Pending";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string ProjectId { get; set; } = string.Empty;
    public List<string> AssignedUsers { get; set; } = new();
    public string CreatedBy { get; set; } = string.Empty;
}