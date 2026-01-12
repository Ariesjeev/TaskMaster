namespace API.Helpers;

public interface IJwtService
{
    string GenerateToken(string userId);
}
