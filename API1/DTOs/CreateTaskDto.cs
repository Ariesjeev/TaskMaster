namespace API.DTOs;

public class CreateTaskDto
{
    public string TaskTitle { get; set; } = string.Empty;
    public string TaskDescription { get; set; } = string.Empty;
    public string TaskStatus { get; set; } = "Pending";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<string> AssignedUsers { get; set; } = new();
    //public List<string> AssignedUsers { get; set; } = new List<string>();

}