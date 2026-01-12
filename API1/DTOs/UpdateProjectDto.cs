namespace API.DTOs;

// Updated UpdateProjectDto
public class UpdateProjectDto
{
    public string? title { get; set; }
    public string? description { get; set; }
    public string? category { get; set; }
    public string? projectStatus { get; set; }
    public List<string>? teamLeaders { get; set; } // New field
    public List<string>? assignedUsers { get; set; }
    public DateTime? startDate { get; set; }
    public DateTime? endDate { get; set; }
    public bool? isDelete { get; set; }
}
