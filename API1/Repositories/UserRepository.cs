using API.Data;
using API.Models;
using API.DTOs;
using MongoDB.Driver;
using MongoDB.Driver.Linq;

namespace API.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MongoDbContext _context;

    public UserRepository(MongoDbContext context) => _context = context;

    public async Task CreateAsync(User user) => await _context.Users.InsertOneAsync(user);

    // Fixed syntax error - use _context and _ instead of *context and *
    public async Task<List<User>> GetAllAsync() => await _context.Users.Find(_ => true).ToListAsync();

    public async Task<User?> GetByEmailAsync(string email) => await _context.Users.Find(u => u.email == email).FirstOrDefaultAsync();

    public async Task<User?> GetByIdAsync(string id) => await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.Users.DeleteOneAsync(u => u.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> UpdateAsync(User user)
    {
        var result = await _context.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return result.ModifiedCount > 0;
    }

    // Implementation with specific types
    public async Task UpdateFieldsAsync(string id, string? name, string? email, string? role, string? designation, bool? isActive)
    {
        var updates = new List<UpdateDefinition<User>>();

        if (name != null) updates.Add(Builders<User>.Update.Set(u => u.name, name));
        if (email != null) updates.Add(Builders<User>.Update.Set(u => u.email, email));
        if (role != null) updates.Add(Builders<User>.Update.Set(u => u.role, role));
        if (designation != null) updates.Add(Builders<User>.Update.Set(u => u.designation, designation));
        if (isActive.HasValue) updates.Add(Builders<User>.Update.Set(u => u.isActive, isActive.Value));

        if (updates.Count > 0)
        {
            var updateDef = Builders<User>.Update.Combine(updates);
            await _context.Users.UpdateOneAsync(u => u.Id == id, updateDef);
        }
    }

    public async Task<List<User>> GetByIdsAsync(List<string> ids)
    {
        return await _context.Users.Find(u => ids.Contains(u.Id)).ToListAsync();
    }

    public async Task<(List<User> Users, long TotalCount)> GetAllAsync(QueryParametersDto parameters)
    {
        // Get IQueryable for LINQ
        var query = _context.Users.AsQueryable();

        // Apply filtering
        if (!string.IsNullOrEmpty(parameters.Search))
        {
            //query = query.Where(u => u.name.ToLower().Contains(parameters.Search.ToLower()));
            query = query.Where(u =>
              u.name.ToLower().Contains(parameters.Search.ToLower()) ||
              u.designation.ToLower().Contains(parameters.Search.ToLower()));
        }
        if (!string.IsNullOrEmpty(parameters.Role))
        {
            query = query.Where(u => u.role == parameters.Role);
        }

        // NEW: Filter by designation
        if (!string.IsNullOrEmpty(parameters.Designation))
        {
            query = query.Where(u => u.designation == parameters.Designation);
        }

        if (parameters.IsActive.HasValue)
        {
            query = query.Where(u => u.isActive == parameters.IsActive.Value);
        }

        // Get total count before pagination
        var totalCount = query.Count();

        // Apply sorting
        if (!string.IsNullOrEmpty(parameters.SortBy))
        {
            bool desc = parameters.SortDescending ?? false;
            query = parameters.SortBy.ToLower() switch
            {
                "name" => desc ? query.OrderByDescending(u => u.name) : query.OrderBy(u => u.name),
                "email" => desc ? query.OrderByDescending(u => u.email) : query.OrderBy(u => u.email),
                "designation" => desc ? query.OrderByDescending(u => u.designation) : query.OrderBy(u => u.designation),
                "createdat" => desc ? query.OrderByDescending(u => u.createdAt) : query.OrderBy(u => u.createdAt),
                _ => query.OrderBy(u => u.name) // Default sort by name
            };
        }

        // Apply pagination
        int skip = (parameters.Page - 1) * parameters.PerPage;
        var users = await query.Skip(skip).Take(parameters.PerPage).ToListAsync();

        return (users, totalCount);
    }
}