using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using static API.DTOs.TaskActivityDto;

namespace API.Controllers
{
    [ApiController]
    [Route("api/tasks/{taskId}/activities")]
    public class TaskActivitiesController : ControllerBase
    {
        private readonly ITaskActivityService _activityService;

        public TaskActivitiesController(ITaskActivityService activityService)
        {
            _activityService = activityService;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetTaskActivities(string taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("admin");

            try
            {
                var activities = await _activityService.GetTaskActivities(taskId, userId, isAdmin);
                return Ok(activities);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}