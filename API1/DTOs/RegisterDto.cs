namespace API.DTOs;

// Updated RegisterDto to allow role specification
public class RegisterDto
{
    public string name { get; set; } = string.Empty;
    public string email { get; set; } = string.Empty;
    public string password { get; set; } = string.Empty;
    public string? role { get; set; } // Optional, defaults to "user"
    public string? designation { get; set; }
}