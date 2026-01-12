using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using API.Models;
using API.Settings;
using Microsoft.IdentityModel.Tokens;

namespace API.Helpers;

public class JwtHelper
{
    private readonly JwtSettings _settings;

    public JwtHelper(JwtSettings settings)
    {
        _settings = settings;
    }

    public string GenerateToken(User user)
    {
        var claims = new[]
        {
             new Claim(ClaimTypes.NameIdentifier, user.Id),
              new Claim("userId", user.Id),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.email),
            new Claim(ClaimTypes.Role, user.role),
            // new Claim(ClaimTypes.Name, user.Id),
            new Claim(ClaimTypes.Name, user.name),
             new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
