// Updated IUserService.cs
using API.DTOs;
using API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Services;

public interface IUserService
{
    Task<UserDto?> RegisterAsync(RegisterDto dto, string? creatorId = null);
    Task<UserDto?> LoginAsync(LoginDto dto);
    Task<(List<UserDto> Users, long TotalCount)> GetAllAsync(QueryParametersDto queryParameters);
    Task<bool> UpdateUserAsync(string id, UpdateUserDto dto);
    Task<bool> DeleteUserAsync(string id);
    Task<List<UserDto>> GetTeamLeadersAsync();
    Task<List<UserDto>> GetUsersByRoleAsync(string role);
    Task<UserDto?> GetByIdAsync(string id);
    Task<UserDto?> GetByEmailAsync(string email);
}