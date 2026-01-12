namespace API.DTOs
{
    // New DTOs for team leader management
    public class AssignTeamLeaderDto
    {
        public string ProjectId { get; set; } = string.Empty;
        public List<string> TeamLeaderIds { get; set; } = new();
    }

    public class AssignUsersToTeamLeaderDto
    {
        public string ProjectId { get; set; } = string.Empty;
        public List<string> UserIds { get; set; } = new();
    }
}
