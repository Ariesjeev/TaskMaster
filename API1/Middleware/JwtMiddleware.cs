using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using API.Models;
using API.Settings;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;

namespace API.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _secret;
        private readonly IMongoCollection<User> _usersCollection;

        public JwtMiddleware(RequestDelegate next, IOptions<JwtSettings> jwtSettings, IOptions<MongoDBSettings> mongoSettings)
        {
            _next = next;
            _secret = jwtSettings.Value.SecretKey;

            var client = new MongoClient(mongoSettings.Value.ConnectionString);
            var database = client.GetDatabase(mongoSettings.Value.DatabaseName);
            _usersCollection = database.GetCollection<User>("Users");
        }

        public async Task Invoke(HttpContext context)
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (token != null)
                await AttachUserToContext(context, token);

            await _next(context);
        }

        private async Task AttachUserToContext(HttpContext context, string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_secret);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true, 
                    ValidIssuer = "API", //should be match to your JwtSettings
                    ValidateAudience = true,
                    ValidAudience = "frontend", //should be match to your JwtSettings
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var userId = jwtToken.Claims.First(x => x.Type == ClaimTypes.Name).Value;

                if (!string.IsNullOrEmpty(userId))
                {
                    var user = await _usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
                    if (user != null)
                    {
                        var claims = new List<Claim>
                        {
                            new Claim(ClaimTypes.Name, user.Id),
                             new Claim(ClaimTypes.Name, user.name),
                            new Claim(ClaimTypes.Role, user.role)
                        };

                        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims));
                        context.Items["User"] = user;
                    }
                }
            }
            catch
            {
                // Don't attach user if token is invalid
            }
        }
    }
}
