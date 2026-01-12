import React, { useState, useEffect, useContext } from "react";
import {
    Card,
    Button,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Checkbox,
    Tag,
    Typography,
    Space,
    Empty,
    Row,
    Col,
    Divider,
    Tabs,
    Tooltip,
    message
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    DownOutlined,
    UpOutlined,
    RestOutlined,
    FileTextOutlined,
    MessageOutlined,
    HistoryOutlined,
    LockOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import { fetchTasks, updateTask, deleteTask, fetchProjectUsers, fetchProjectDetails } from "../services/api";
import CommentSection from "../components/CommentSection";
import TaskActivitySection from "../components/TaskActivitySection";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface User {
    id: string;
    name: string;
    isActive?: boolean;
}

interface Task {
    id: string;
    taskTitle: string;
    taskDescription: string;
    taskStatus: "Pending" | "In Progress" | "Completed";
    startDate: string;
    endDate: string;
    assignedUsers: string[];
    isDelete?: boolean;
}

interface AuthContextType {
    user: {
        token: string;
        role: string;
        id: string;
    } | null;
}

interface EditData {
    id: string;
    taskTitle: string;
    taskDescription: string;
    taskStatus: "Pending" | "In Progress" | "Completed";
    startDate: string;
    endDate: string;
    assignedUsers: string[];
    isDelete?: boolean;
}

interface TaskDetailsProps {
    projectId: string;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ projectId }) => {
    const { user } = useContext(AuthContext) as AuthContextType;
    const token = user?.token;
    const userRole = user?.role;
    const userId = user?.id;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [expandedTask, setExpandedTask] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditData>({
        id: "",
        taskTitle: "",
        taskDescription: "",
        taskStatus: "Pending",
        startDate: "",
        endDate: "",
        assignedUsers: [],
    });
    const [showEditForm, setShowEditForm] = useState<boolean>(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [canEditTasks, setCanEditTasks] = useState<boolean>(false);
    const [isAssignedUser, setIsAssignedUser] = useState<boolean>(false);

    useEffect(() => {
        const checkPermissions = async () => {
            if (!token || !projectId) return;

            try {
                if (userRole === 'admin') {
                    setCanEditTasks(true);
                } else if (userRole === 'teamleader') {
                    // Check if user is team leader for this specific project
                    const projectDetails = await fetchProjectDetails(projectId, token);
                    const isProjectTeamLeader = projectDetails.teamLeaders?.some(
                        (leader: any) => leader.id === userId
                    );
                    setCanEditTasks(isProjectTeamLeader);
                } else {
                    setCanEditTasks(false);
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
            }
        };

        checkPermissions();
    }, [token, projectId, userRole, userId]);

    useEffect(() => {
        const getTasks = async (): Promise<void> => {
            if (!token || !projectId) {
                console.error("Token or Project ID missing!");
                return;
            }
            try {
                const response: any = await fetchTasks(projectId, token);
                setTasks(response);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        const getUsers = async (): Promise<void> => {
            if (!token) return;
            try {
                const users: User[] = await fetchProjectUsers(projectId, token);
                setAllUsers(users);
                const map: Record<string, string> = {};
                users.forEach(user => {
                    map[user.id] = user.name;
                });
                setUserMap(map);
            } catch (err) {
                console.error("Failed to fetch users.");
            }
        };

        getUsers();
        getTasks();
    }, [token, projectId]);

    useEffect(() => {
        if (allUsers.length > 0) {
            setEditData((prev) => ({
                ...prev,
                assignedUsers: prev.assignedUsers.filter(id => allUsers.some(u => u.id === id))
            }));
        }
    }, [allUsers]);

    const toggleTaskDetails = (taskId: string): void => {
        setExpandedTask(expandedTask === taskId ? null : taskId);
    };

    const handleEdit = (task: Task): void => {
        // Check if user is assigned to this task
        const userIsAssigned = task.assignedUsers?.includes(userId || '');
        setIsAssignedUser(userIsAssigned);

        // Allow editing if user is admin, team leader, or assigned to the task
        if (!canEditTasks && !userIsAssigned) {
            message.warning("You don't have permission to edit this task");
            return;
        }

        const taskData = {
            ...task,
            startDate: task.startDate ? task.startDate.split("T")[0] : "",
            endDate: task.endDate ? task.endDate.split("T")[0] : "",
            assignedUsers: Array.isArray(task.assignedUsers) ? task.assignedUsers.map(u => typeof u === 'object' ? (u as any).id : u) : [],
        };
        setEditData(taskData);
        setShowEditForm(true);
    };

    const handleEditChange = (field: string, value: any): void => {
        setEditData((prevData) => ({
            ...prevData,
            [field]: value,
        }));
    };

    const handleUpdate = async (): Promise<void> => {
        if (!token) return;

        // Check permissions before sending update
        if (!canEditTasks && !isAssignedUser) {
            message.error("You don't have permission to update this task");
            return;
        }

        try {
            const dataToSend = {
                ...editData,
                startDate: editData.startDate ? new Date(editData.startDate).toISOString() : null,
                endDate: editData.endDate ? new Date(editData.endDate).toISOString() : null,
            };

            await updateTask(editData.id, dataToSend, token);
            const response: any = await fetchTasks(projectId, token);
            setTasks(response);
            setShowEditForm(false);
            message.success("Task updated successfully!");
        } catch (error) {
            console.error("Error updating task:", error);
            message.error("Failed to update task");
        }
    };

    const handleDelete = async (taskId: string): Promise<void> => {
        if (!token || (!canEditTasks)) {
            message.warning("Only administrators and team leaders can delete tasks");
            return;
        }

        try {
            await deleteTask(taskId, token);
            setTasks(tasks.filter((task) => task.id !== taskId));
            setShowDeleteConfirm(false);
            message.success("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            message.error("Failed to delete task");
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'Completed':
                return 'success';
            case 'In Progress':
                return 'processing';
            default:
                return 'default';
        }
    };

    const getStatusDotColor = (status: string): string => {
        switch (status) {
            case 'Completed':
                return '#52c41a';
            case 'In Progress':
                return '#1890ff';
            default:
                return '#faad14';
        }
    };

    // Check if current user can edit the task
    const canUserEditTask = (task: Task): boolean => {
        const userIsAssigned = task.assignedUsers?.includes(userId || '');
        return canEditTasks || userIsAssigned;
    };

    return (
        <div style={{ padding: '24px' }}>
            {tasks.length > 0 ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {tasks.map((task) => {
                        const userCanEdit = canUserEditTask(task);

                        return (
                            <Card
                                key={task.id}
                                style={{
                                    opacity: task.isDelete ? 0.5 : 1,
                                    border: task.isDelete ? '1px dashed #d9d9d9' : '1px solid #d9d9d9'
                                }}
                            >
                                <div
                                    onClick={() => toggleTaskDetails(task.id)}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: getStatusDotColor(task.taskStatus)
                                            }}
                                        />
                                        <Title level={4} style={{ margin: 0 }}>
                                            {task.taskTitle}
                                        </Title>
                                    </div>
                                    {expandedTask === task.id ? <UpOutlined /> : <DownOutlined />}
                                </div>

                                {expandedTask === task.id && (
                                    <>
                                        <Divider />
                                        <Row gutter={[24, 16]}>
                                            <Col span={24}>
                                                <div>
                                                    <Text strong>Description</Text>
                                                    <div style={{ marginTop: '8px' }}>
                                                        <Text>{task.taskDescription || "No description"}</Text>
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={12}>
                                                <div>
                                                    <Text strong>Status</Text>
                                                    <div style={{ marginTop: '8px' }}>
                                                        <Tag color={getStatusColor(task.taskStatus)}>
                                                            {task.taskStatus}
                                                        </Tag>
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={12}>
                                                <div>
                                                    <Text strong>Start Date</Text>
                                                    <div style={{ marginTop: '8px' }}>
                                                        <Text>
                                                            {new Date(task.startDate).toLocaleDateString('en-GB', {
                                                                timeZone: 'UTC',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={12}>
                                                <div>
                                                    <Text strong>End Date</Text>
                                                    <div style={{ marginTop: '8px' }}>
                                                        <Text>
                                                            {new Date(task.endDate).toLocaleDateString('en-GB', {
                                                                timeZone: 'UTC',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={24}>
                                                <div>
                                                    <Text strong>Assigned Team</Text>
                                                    <div style={{ marginTop: '8px' }}>
                                                        {task.assignedUsers && task.assignedUsers.length > 0 ? (
                                                            <Space wrap>
                                                                {task.assignedUsers.map((userId) => (
                                                                    <Tag key={userId} color="blue">
                                                                        {userMap[userId] || "Unknown User"}
                                                                    </Tag>
                                                                ))}
                                                            </Space>
                                                        ) : (
                                                            <Text type="secondary">No team members assigned</Text>
                                                        )}
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={24}>
                                                <Space>
                                                    {userCanEdit && (
                                                        <Button
                                                            type="primary"
                                                            icon={<EditOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(task);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {canEditTasks && (
                                                        <Button
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTask(task);
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </Space>
                                            </Col>
                                        </Row>
                                        <Divider />
                                        <Tabs
                                            defaultActiveKey="comments"
                                            type="card"
                                            destroyInactiveTabPane={true}
                                        >
                                            <TabPane
                                                tab={<span>Comments</span>}
                                                key="comments"
                                            >
                                                <CommentSection
                                                    key="comments-section"
                                                    taskId={task.id}
                                                    taskTitle={task.taskTitle}
                                                />
                                            </TabPane>
                                            <TabPane
                                                tab={<span>TaskActivity</span>}
                                                key="activity"
                                            >
                                                <TaskActivitySection
                                                    key="activity-section"
                                                    taskId={task.id}
                                                    taskTitle={task.taskTitle}
                                                />
                                            </TabPane>
                                        </Tabs>
                                    </>
                                )}
                            </Card>
                        );
                    })}
                </Space>
            ) : (
                <Empty
                    image={<FileTextOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                    description={
                        <div>
                            <Title level={4} style={{ color: '#595959' }}>No tasks available</Title>
                            <Text type="secondary">Create a new task to get started</Text>
                        </div>
                    }
                />
            )}

            {/* Edit Modal with conditional fields */}
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Edit Task</span>
                        {/*  {isAssignedUser && !canEditTasks && (
                            <Tag color="orange" icon={<LockOutlined />}>
                                Limited Edit Mode
                            </Tag>
                        )}*/ }
                    </div>
                }
                open={showEditForm}
                onOk={handleUpdate}
                onCancel={() => setShowEditForm(false)}
                okText="Save Changes"
                cancelText="Cancel"
                width={600}
            >
                <div style={{ marginTop: '16px' }}>
                    {/* Title - Only editable by admins and team leaders */}
                    <div style={{ marginBottom: '16px' }}>
                        <Text strong>Task Title</Text>
                        {!canEditTasks && (
                            <Tooltip title="Only team leaders and admins can edit this field">
                                { /*  <LockOutlined style={{ marginLeft: '8px', color: '#ff9800' }} /> */}
                            </Tooltip>
                        )}
                        <Input
                            style={{ marginTop: '8px' }}
                            value={editData.taskTitle}
                            onChange={(e) => handleEditChange('taskTitle', e.target.value)}
                            disabled={!canEditTasks}
                        />
                    </div>

                    {/* Description - Editable by all */}
                    <div style={{ marginBottom: '16px' }}>
                        <Text strong>Task Description</Text>
                        <TextArea
                            rows={4}
                            style={{ marginTop: '8px' }}
                            value={editData.taskDescription}
                            onChange={(e) => handleEditChange('taskDescription', e.target.value)}
                        />
                    </div>

                    {/* Team Members - Only editable by admins and team leaders */}
                    <div style={{ marginBottom: '16px' }}>
                        <Text strong>Team Members</Text>
                        {!canEditTasks && (
                            <Tooltip title="Only team leaders and admins can edit this field">
                                { /*   <LockOutlined style={{ marginLeft: '8px', color: '#ff9800' }} />*/}
                            </Tooltip>
                        )}
                        <div style={{ marginTop: '8px' }}>
                            {allUsers && allUsers?.length > 0 ? (
                                allUsers.map((u) => (
                                    <div key={u.id} style={{ marginBottom: '8px' }}>
                                        <Checkbox
                                            checked={editData.assignedUsers?.includes(u.id) || false}
                                            onChange={(e) => {
                                                const updatedUsers = e.target.checked
                                                    ? [...editData.assignedUsers, u.id]
                                                    : editData.assignedUsers.filter(id => id !== u.id);
                                                handleEditChange('assignedUsers', updatedUsers);
                                            }}
                                            disabled={!canEditTasks}
                                        >
                                            {u?.name || "Unknown User"}
                                        </Checkbox>
                                    </div>
                                ))
                            ) : (
                                <Text>Loading users...</Text>
                            )}
                        </div>
                    </div>

                    {/* Status - Editable by assigned users and above */}
                    <div style={{ marginBottom: '16px' }}>
                        <Text strong>Status</Text>
                        <Select
                            style={{ width: '100%', marginTop: '8px' }}
                            value={editData.taskStatus}
                            onChange={(value) => handleEditChange('taskStatus', value)}
                        >
                            <Option value="Pending">Pending</Option>
                            <Option value="In Progress">In Progress</Option>
                            <Option value="Completed">Completed</Option>
                        </Select>
                    </div>

                    {/* Dates - Only editable by admins and team leaders */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text strong>Start Date</Text>
                                {!canEditTasks && (
                                    <Tooltip title="Only team leaders and admins can edit this field">
                                        {/*   <LockOutlined style={{ marginLeft: '8px', color: '#ff9800' }} />*/}
                                    </Tooltip>
                                )}
                                <DatePicker
                                    style={{ width: '100%', marginTop: '8px' }}
                                    value={editData.startDate ? dayjs(editData.startDate) : null}
                                    onChange={(date) => handleEditChange('startDate', date ? date.format('YYYY-MM-DD') : '')}
                                    disabled={!canEditTasks}
                                />
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: '16px' }}>
                                <Text strong>End Date</Text>
                                <DatePicker
                                    style={{ width: '100%', marginTop: '8px' }}
                                    value={editData.endDate ? dayjs(editData.endDate) : null}
                                    onChange={(date) => handleEditChange('endDate', date ? date.format('YYYY-MM-DD') : '')}
                                />
                            </div>
                        </Col>
                    </Row>

                    
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Confirm Deletion"
                open={showDeleteConfirm}
                onOk={() => handleDelete(selectedTask?.id || "")}
                onCancel={() => setShowDeleteConfirm(false)}
                okText="Delete Task"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <Text>Are you sure you want to delete this task</Text>
            </Modal>
        </div>
    );
};

export default TaskDetails;