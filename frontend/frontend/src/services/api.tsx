{/*function ReactComponent() {
  return ("http://localhost:5220/api"
 
    <p>Hello world!</p>
  );
}

export default ReactComponent;

*/}
import axios, { type AxiosResponse, AxiosError } from "axios";

const API = axios.create({
  baseURL: "http://localhost:5220/api"

});

// Type Definitions


interface User {
  id: string;
  name: string;
  email: string;
    role: string;
    designation?: string; 
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
    role?: string;
    designation?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
    role?: string;
    designation?: string;
  isActive?: boolean;
}

interface Pagination {
  currentPage: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FetchUsersParams {
  includeAll: any;
  search?: string;
    role?: string;
    designation?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  perPage?: number;
}

interface FetchUsersResponse {
  users: User[];
  pagination: Pagination;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedUsers: string[];
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

interface CreateProjectData {
  title: string;
  description: string;
    category: string;
    teamLeaders: string[]; 
  assignedUsers: string[];
  startDate: string;
  endDate: string;
}

interface UpdateProjectData {
  title?: string;
  description?: string;
    category?: string;
    teamLeaders?: string[];
  assignedUsers?: string[];
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface FetchProjectsParams {
  search?: string;
  status?: string;
  category?: string;
  isDeleted?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  perPage?: number;
}

interface FetchProjectsResponse {
  projects: Project[];
  pagination: Pagination;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedUserId: string;
  projectId: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateTaskData {
  title: string;
  description: string;
  priority: string;
  assignedUserId: string;
  dueDate?: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedUserId?: string;
  dueDate?: string;
}

//interface ApiError {
//message: string;
//status?: number;
//}

// Add these interfaces to your existing api.ts file
interface Comment {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  canEdit: boolean;
  canDelete: boolean;
}

interface CreateCommentData {
  content: string;
}

interface UpdateCommentData {
  content: string;
}

//u

export const publicRegisterUser = async (userData: RegisterUserData): Promise<any> => {
    try {
        const response: AxiosResponse = await API.post("users/register", userData);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error("Registration failed:", axiosError.response?.data?.message || axiosError.message);
        throw new Error(axiosError.response?.data?.message || "Registration failed. Please try again.");
    }
};

export const loginUser = async (credentials: LoginCredentials): Promise<any> => {
  try {
    const response: AxiosResponse = await API.post("users/login", credentials);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Login failed:", axiosError.response?.data?.message || axiosError.message);
    throw new Error(axiosError.response?.data?.message || "Login failed. Please try again.");
  }
};

export const registerUser = async (userData: RegisterUserData, token: string): Promise<any> => {
    try {
        const response: AxiosResponse = await API.post("users/create", userData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error("User creation failed:", axiosError.response?.data?.message || axiosError.message);

        // Handle specific error cases
        if (axiosError.response?.status === 403) {
            throw new Error("You don't have permission to create this type of user");
        }

        throw new Error(axiosError.response?.data?.message || "Failed to create user. Please try again.");
    }
};
//a


// api.tsx - Fixed fetchUsers function

// Fixed fetchUsers function for api.tsx
// Replace your existing fetchUsers function with this one

export const fetchUsers = async (token: string, params: FetchUsersParams = {
    includeAll: undefined
}): Promise<FetchUsersResponse> => {
    try {
        // Clean up parameters before sending
        const cleanParams: any = {
            page: params.page || 1,
            perPage: params.perPage || 10,
            sortBy: params.sortBy || 'name',
            sortDescending: params.sortDescending || false
        };

        // Only add optional parameters if they have values
        if (params.search) cleanParams.search = params.search;
        if (params.role) cleanParams.role = params.role;
        if (params.designation) cleanParams.designation = params.designation;
        if (params.isActive !== undefined) cleanParams.isActive = params.isActive;
        if (params.includeAll !== undefined) cleanParams.includeAll = params.includeAll;

        console.log('Fetching users with params:', cleanParams);

        const response: AxiosResponse = await API.get("users", {
            headers: { Authorization: `Bearer ${token}` },
            params: cleanParams
        });

        console.log('Raw API Response:', response.data);

        // Handle the response structure from your C# backend
        // C# typically returns PascalCase properties
        const responseData = response.data;

        // Extract users array - handle both PascalCase and camelCase
        let users: User[] = [];
        if (responseData.Data) {
            users = responseData.Data;
        } else if (responseData.data) {
            users = responseData.data;
        } else if (Array.isArray(responseData)) {
            users = responseData;
        }

        // Map users to ensure consistent property names
        const mappedUsers = users.map((user: any) => ({
            id: user.id || user.Id,
            name: user.name || user.Name,
            email: user.email || user.Email,
            role: user.role || user.Role,
            designation: user.designation || user.Designation,
            isActive: user.isActive !== undefined ? user.isActive : user.IsActive,
            createdAt: user.createdAt || user.CreatedAt,
            updatedAt: user.updatedAt || user.UpdatedAt,
            teamLeaderProjects: user.teamLeaderProjects || user.TeamLeaderProjects || [],
            teamLeaderId: user.teamLeaderId || user.TeamLeaderId,
            createdBy: user.createdBy || user.CreatedBy
        }));

        // Extract pagination - handle PascalCase from C# backend
        let pagination: Pagination = {
            currentPage: params.page || 1,
            perPage: params.perPage || 10,
            totalCount: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
        };

        if (responseData.Pagination) {
            const p = responseData.Pagination;
            pagination = {
                currentPage: p.CurrentPage || p.currentPage || params.page || 1,
                perPage: p.PerPage || p.perPage || params.perPage || 10,
                totalCount: p.TotalCount || p.totalCount || mappedUsers.length,
                totalPages: p.TotalPages || p.totalPages || Math.ceil((p.TotalCount || mappedUsers.length) / (p.PerPage || params.perPage || 10)),
                hasNextPage: p.HasNextPage !== undefined ? p.HasNextPage : p.hasNextPage || false,
                hasPreviousPage: p.HasPreviousPage !== undefined ? p.HasPreviousPage : p.hasPreviousPage || false
            };
        } else if (responseData.pagination) {
            pagination = responseData.pagination;
        }

        console.log('Processed response:', {
            usersCount: mappedUsers.length,
            pagination
        });

        return {
            users: mappedUsers,
            pagination: pagination
        };
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error fetching users:", axiosError.response?.data || axiosError);

        // Return empty array on error instead of throwing
        return {
            users: [],
            pagination: {
                currentPage: params.page || 1,
                perPage: params.perPage || 10,
                totalCount: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
            }
        };
    }
};


//export const fetchUsers = async (token: string, params: FetchUsersParams = {
//    includeAll: undefined
//}): Promise<FetchUsersResponse> => {
//    try {
//        const response: AxiosResponse = await API.get("users", {
//            headers: { Authorization: `Bearer ${token}` },
//            params: {
//                search: params.search,
//                role: params.role,
//                designation: params.designation,
//                isActive: params.isActive !== undefined ? params.isActive : true, // Default to active users
//                sortBy: params.sortBy || 'name',
//                sortDescending: params.sortDescending || false,
//                page: params.page || 1,
//                perPage: params.perPage || 10, // Get more users by default
//                includeAll: params.includeAll
//            }
//        });

//        // Handle different response structures from your backend
//        // Your backend returns { Data: [], Pagination: {} }
//        const responseData = response.data;

//        // Extract users array - handle both uppercase and lowercase
//        let users = [];
//        if (responseData.Data) {
//            users = responseData.Data;
//        } else if (responseData.data) {
//            users = responseData.data;
//        } else if (Array.isArray(responseData)) {
//            users = responseData;
//        } else {
//            users = [];
//        }

//        // Extract pagination - handle both uppercase and lowercase
//        let pagination = {
//            currentPage: 1,
//            perPage: params.perPage || 10,
//            totalCount: 0,
//            totalPages: 1,
//            hasNextPage: false,
//            hasPreviousPage: false
//        };

//        if (responseData.Pagination) {
//            pagination = {
//                currentPage: responseData.Pagination.CurrentPage || responseData.Pagination.currentPage || 1,
//                perPage: responseData.Pagination.PerPage || responseData.Pagination.perPage || params.perPage || 10,
//                totalCount: responseData.Pagination.TotalCount || responseData.Pagination.totalCount || users.length,
//                totalPages: responseData.Pagination.TotalPages || responseData.Pagination.totalPages || 1,
//                hasNextPage: responseData.Pagination.HasNextPage || responseData.Pagination.hasNextPage || false,
//                hasPreviousPage: responseData.Pagination.HasPreviousPage || responseData.Pagination.hasPreviousPage || false
//            };
//        } else if (responseData.pagination) {
//            pagination = responseData.pagination;
//        }

//        return {
//            users: Array.isArray(users) ? users : [],
//            pagination: pagination
//        };
//    } catch (error) {
//        const axiosError = error as AxiosError;
//        console.error("Error fetching users:", axiosError.response?.data || axiosError);

//        // Return empty array on error instead of throwing
//        return {
//            users: [],
//            pagination: {
//                currentPage: 1,
//                perPage: params.perPage || 10,
//                totalCount: 0,
//                totalPages: 1,
//                hasNextPage: false,
//                hasPreviousPage: false
//            }
//        };
//    }
//};
export const updateUser = async (userId: string, updatedData: UpdateUserData, token: string): Promise<User> => {
    try {
        const response: AxiosResponse<User> = await API.put(`users/${userId}`, updatedData, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Update user error:", axiosError.response?.data || axiosError);
        throw axiosError;
    }
};

export const deleteUser = async (userId: string, token: string): Promise<void> => {
  try {
    await API.delete(`users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("User deleted successfully:", userId);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Delete user error:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};


///add the some data 
export const fetchTeamLeaders = async (token: string): Promise<User[]> => {
    try {
        const response: AxiosResponse<User[]> = await API.get("/users/team-leaders", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error fetching team leaders:", axiosError);
        throw axiosError;
    }
};

export const fetchUsersByRole = async (role: string, token: string): Promise<User[]> => {
    try {
        const response: AxiosResponse<User[]> = await API.get(`/users/by-role/${role}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error fetching users by role:", axiosError);
        throw axiosError;
    }
};

export const assignTeamLeaders = async (projectId: string, teamLeaderIds: string[], token: string): Promise<any> => {
    try {
        const response = await API.post(`/projects/${projectId}/team-leaders`, teamLeaderIds, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error assigning team leaders:", axiosError);
        throw axiosError;
    }
};

export const assignUsersToProject = async (projectId: string, userIds: string[], token: string): Promise<any> => {
    try {
        const response = await API.post(`/projects/${projectId}/assign-users`, userIds, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error assigning users:", axiosError);
        throw axiosError;
    }
};

// Project CRUD Operations perform


export const fetchProjects = async (token: string, params: FetchProjectsParams = {}): Promise<FetchProjectsResponse> => {
  try {
    const response: AxiosResponse = await API.get("/projects", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        search: params.search,
        status: params.status,
        category: params.category,
        isDeleted: params.isDeleted,
        sortBy: params.sortBy,
        sortDescending: params.sortDescending,
        page: params.page || 1,
        perPage: params.perPage || 6
      }
    });

    return {
      projects: response.data.data || [],
      pagination: response.data.pagination || {
        currentPage: 1,
        perPage: 6,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error fetching projects:", axiosError.response?.data || axiosError);
    return {
      projects: [],
      pagination: {
        currentPage: 1,
        perPage: 6,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }
};

export const fetchProjectDetails = async (id: string, token: string): Promise<Project> => {
  try {
    const response: AxiosResponse<Project> = await API.get(`/projects/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error fetching project details:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};

export const fetchProjectUsers = async (projectId: string, token: string): Promise<User[]> => {
  try {
    const response: AxiosResponse<User[]> = await API.get(`/projects/${projectId}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error fetching project users:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const createProject = async (projectData: CreateProjectData, token: string): Promise<Project> => {
  try {
    const response: AxiosResponse<Project> = await API.post("/projects", projectData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error creating project:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const updateProject = async (projectId: string, projectData: UpdateProjectData, token: string): Promise<Project> => {
  try {
    const response: AxiosResponse<Project> = await API.put(`/projects/${projectId}`, projectData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error updating project:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const deleteProject = async (projectId: string, token: string): Promise<void> => {
  try {
    await API.delete(`/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Project deleted successfully:", projectId);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Delete project error:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

// Task Management


export const fetchTasks = async (projectId: string, token: string): Promise<Task[]> => {
  try {
    const response: AxiosResponse<Task[]> = await API.get(`/tasks/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error fetching tasks:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const createTask = async (projectId: string, taskData: CreateTaskData, token: string): Promise<Task> => {
  try {
    const response: AxiosResponse<Task> = await API.post(`/tasks/${projectId}`, taskData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error creating task:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const updateTask = async (taskId: string, updatedData: UpdateTaskData, token: string): Promise<Task> => {
  try {
    const response: AxiosResponse<Task> = await API.put(`/tasks/${taskId}`, updatedData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error updating task:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const deleteTask = async (taskId: string, token: string): Promise<void> => {
  try {
    await API.delete(`/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Task deleted successfully:", taskId);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error deleting task:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

// Add this to your existing api.ts file where you have the axios instance
export const fetchTaskActivities = async (taskId: string, token: string) => {
  try {
    const response = await API.get(`/tasks/${taskId}/activities`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Task Activities Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in fetchTaskActivities:', error);
    throw error;
  }
};

// Add these API functions to your existing api.ts file after your existing functions

// Comment Management API Functions

// Task Activities API Functions
// export const fetchTaskActivities = async (taskId:string, token:string):Promise<Comment[]> => {
//   try {
//     const response = await fetch(`/api/tasks/${taskId}/activities`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error fetching task activities:', error);
//     throw error;
//   }
// };
export const fetchTaskComments = async (taskId: string, token: string): Promise<Comment[]> => {
  try {
    const response: AxiosResponse<Comment[]> = await API.get(`/tasks/${taskId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error fetching comments:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const createComment = async (taskId: string, commentData: CreateCommentData, token: string): Promise<Comment> => {
  try {
    const response: AxiosResponse<Comment> = await API.post(`/tasks/${taskId}/comments`, commentData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error creating comment:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const updateComment = async (taskId: string, commentId: string, commentData: UpdateCommentData, token: string): Promise<Comment> => {
  try {
    const response: AxiosResponse<Comment> = await API.put(`/tasks/${taskId}/comments/${commentId}`, commentData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error updating comment:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};

export const deleteComment = async (taskId: string, commentId: string, token: string): Promise<void> => {
  try {
    await API.delete(`/tasks/${taskId}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Comment deleted successfully:", commentId);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error deleting comment:", axiosError.response?.data || axiosError);
    throw axiosError;
  }
};