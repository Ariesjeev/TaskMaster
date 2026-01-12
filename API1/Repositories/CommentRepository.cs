using API.Data;
using API.Models;
using MongoDB.Driver;

namespace API.Repositories
{
    public class CommentRepository : ICommentRepository
    {
        private readonly MongoDbContext _context;

        public CommentRepository(MongoDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Comment>> GetCommentsByTaskId(string taskId)
        {
            return await _context.Comments
                .Find(c => c.TaskId == taskId && !c.IsDeleted)
                .SortBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Comment> GetCommentById(string commentId)
        {
            return await _context.Comments
                .Find(c => c.Id == commentId && !c.IsDeleted)
                .FirstOrDefaultAsync();
        }

        public async Task<Comment> CreateComment(Comment comment)
        {
            await _context.Comments.InsertOneAsync(comment);
            return comment;
        }

        public async Task<Comment> UpdateComment(Comment comment)
        {
            comment.UpdatedAt = DateTime.UtcNow;
            await _context.Comments.ReplaceOneAsync(c => c.Id == comment.Id, comment);
            return comment;
        }

        public async Task DeleteComment(string commentId)
        {
            var update = Builders<Comment>.Update
                .Set(c => c.IsDeleted, true)
                .Set(c => c.UpdatedAt, DateTime.UtcNow);

            await _context.Comments.UpdateOneAsync(c => c.Id == commentId, update);
        }

        public async Task<bool> CommentExists(string commentId)
        {
            return await _context.Comments
                .Find(c => c.Id == commentId && !c.IsDeleted)
                .AnyAsync();
        }
    }

}

// 5. Comment Repository Implementation
//using API.Data;
//using API.Models;
//using MongoDB.Driver;

//namespace API.Repositories;

//public class CommentRepository : ICommentRepository
//{
//    private readonly MongoDbContext _context;

//    public CommentRepository(MongoDbContext context)
//    {
//        _context = context;
//    }

//    public async Task<IEnumerable<Comment>> GetCommentsByTaskId(string taskId)
//    {
//        return await _context.Comments
//            .Find(c => c.TaskId == taskId && !c.IsDeleted)
//            .SortBy(c => c.CreatedAt)
//            .ToListAsync();
//    }

//    public async Task<Comment> GetCommentById(string commentId)
//    {
//        return await _context.Comments
//            .Find(c => c.Id == commentId && !c.IsDeleted)
//            .FirstOrDefaultAsync();
//    }

//    public async Task<Comment> CreateComment(Comment comment)
//    {
//        await _context.Comments.InsertOneAsync(comment);
//        return comment;
//    }

//    public async Task<Comment> UpdateComment(Comment comment)
//    {
//        comment.UpdatedAt = DateTime.UtcNow;
//        await _context.Comments.ReplaceOneAsync(c => c.Id == comment.Id, comment);
//        return comment;
//    }

//    public async Task DeleteComment(string commentId)
//    {
//        var update = Builders<Comment>.Update
//            .Set(c => c.IsDeleted, true)
//            .Set(c => c.UpdatedAt, DateTime.UtcNow);

//        await _context.Comments.UpdateOneAsync(c => c.Id == commentId, update);
//    }

//    public async Task<bool> CommentExists(string commentId)
//    {
//        return await _context.Comments
//            .Find(c => c.Id == commentId && !c.IsDeleted)
//            .AnyAsync();
//    }
//}
