using API.Models;

namespace API.Repositories
{
    public interface ICommentRepository
    {

        Task<IEnumerable<Comment>> GetCommentsByTaskId(string taskId);
        Task<Comment> GetCommentById(string commentId);
        Task<Comment> CreateComment(Comment comment);
        Task<Comment> UpdateComment(Comment comment);
        Task DeleteComment(string commentId);
        Task<bool> CommentExists(string commentId);
    }
}


