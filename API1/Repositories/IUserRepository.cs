// Updated IUserRepository.cs
using API.Models;
using API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(string id);
    Task<(List<User> Users, long TotalCount)> GetAllAsync(QueryParametersDto queryParameters);
    Task<List<User>> GetAllAsync(); // Gets all users without pagination
    Task CreateAsync(User user);
    Task<bool> UpdateAsync(User user);
    // Remove the duplicate - keep only one UpdateFieldsAsync with specific types
    Task UpdateFieldsAsync(string id, string? name, string? email, string? role, string? designation, bool? isActive);
    Task<bool> DeleteAsync(string id);
    Task<List<User>> GetByIdsAsync(List<string> ids);
    //Task<string> GetUserById(string userId);
}