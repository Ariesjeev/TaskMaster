using API.DTOs;
using static API.DTOs.TaskActivityDto;

namespace API.Services
{
    public interface ITaskActivityService
    {
        Task<IEnumerable<TaskActivityResponseDto>> GetTaskActivities(string taskId, string userId, bool isAdmin);
        Task LogTaskCreated(string taskId, string createdBy, string createdByName, List<string> assignedUsers);
        Task LogTaskUpdated(string taskId, string updatedBy, string updatedByName, Dictionary<string, (object oldValue, object newValue)> changes);
        Task LogTaskAssigned(string taskId, string assignedBy, string assignedByName, List<string> newAssignedUsers, List<string> oldAssignedUsers);
        Task LogComment(string taskId, string comment, string userId, string userName);
        //Task LogCommentDelete(string taskId, string content, string userId, string createdByName);
        //Task LogCommentUpdate(string taskId, string oldContent, string v, string userId, string createdByName);
        Task LogCommentUpdate(string taskId, string oldComment, string newComment, string userId, string userName);
        Task LogCommentDelete(string taskId, string comment, string userId, string userName);
    }
}