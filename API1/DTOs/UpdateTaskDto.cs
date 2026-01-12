namespace API.DTOs;

public class UpdateTaskDto
{
    public string? TaskTitle { get; set; }
    public string? TaskDescription { get; set; }
    public string? TaskStatus { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<string>? AssignedUsers { get; set; }
    public bool? IsDelete { get; set; }
}

