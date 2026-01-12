namespace API.DTOs;

public class QueryProjectDto{
    public string? Search { get; set; }
    public string? SortBy { get; set; } // by name, start date, end date
    public bool? SortDescending { get; set; }=false;
    public int Page { get; set; } = 1;
    public int PerPage { get; set; } = 6;
    public string? Status { get; set; } // "Pending", "InProgress", "Completed"
    public bool? IsDeleted { get; set; }
    public string? Category { get; set; }
}