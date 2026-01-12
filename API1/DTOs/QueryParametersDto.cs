//this is for user management
namespace API.DTOs;
    public class QueryParametersDto
    {
        //common
        public string? Search { get; set; }
        public string? SortBy { get; set; } // by name, start date, end date
        public bool? SortDescending { get; set; }=false;
        public int Page { get; set; } = 1;
        public int PerPage { get; set; } = 10;
        //user
        public string? Role { get; set; }
    public string? Designation { get; set; }
    public bool? IsActive { get; set; }
    }