namespace API.DTOs
{
    public class TaskActivityDto
    {
        public class TaskActivityResponseDto
        {
            public string Id { get; set; } = string.Empty;
            public string ActivityType { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string UserId { get; set; } = string.Empty;
            public string UserName { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public Dictionary<string, object>? Metadata { get; set; }
        }
    }
}