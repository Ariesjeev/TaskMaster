using static API.DTOs.CommentDto;
using API.DTOs;
using API.Models;
namespace API.Services
{
    public interface ICommentService
    {
        Task<IEnumerable<CommentResponseDto>> GetTaskComments(string taskId, string userId, bool isAdmin);
        Task<CommentResponseDto> CreateComment(string taskId, CreateCommentDto commentDto, string userId, string userName);
        Task<CommentResponseDto> UpdateComment(string commentId, UpdateCommentDto commentDto, string userId, bool isAdmin);
        Task DeleteComment(string commentId, string userId, bool isAdmin);
    }
}

// 6. Comment Service Interface
//using API.DTOs;
//using API.Models;

//namespace API.Services;

//public interface ICommentService
//{
//    Task<IEnumerable<CommentResponseDto>> GetTaskComments(string taskId, string userId, bool isAdmin);
//    Task<CommentResponseDto> CreateComment(string taskId, CreateCommentDto commentDto, string userId, string userName);
//    Task<CommentResponseDto> UpdateComment(string commentId, UpdateCommentDto commentDto, string userId, bool isAdmin);
//    Task DeleteComment(string commentId, string userId, bool isAdmin);
//}
