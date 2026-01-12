// components/createtask.tsx
import React, { useState, useEffect, useContext } from "react";
import { Form, Input, DatePicker, Checkbox, Button, Typography, Divider, message } from "antd";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import { fetchProjectUsers, createTask, fetchProjectDetails } from "../services/api";

const { Title } = Typography;
const { TextArea } = Input;

interface User {
    id: string;
    name: string;
}

interface AuthUser {
    token: string;
    role: string;
    id: string;
}

interface FormData {
    taskTitle: string;
    taskDescription: string;
    startDate: string;
    endDate: string;
    assignedUsers: string[];
}

interface CreateTaskFormProps {
    onCancel: () => void;
    projectId: string;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onCancel, projectId }) => {
    const { user } = useContext<any>(AuthContext);
    const token = user?.token;
    const userRole = user?.role;
    const userId = user?.id;

    const [users, setUsers] = useState<User[]>([]);
    const [canCreateTask, setCanCreateTask] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const checkPermissions = async () => {
            if (!token || !projectId) return;

            try {
                // Check if user can create tasks
                if (userRole === 'admin') {
                    setCanCreateTask(true);
                } else if (userRole === 'teamleader') {
                    // Check if user is team leader for this specific project
                    const projectDetails = await fetchProjectDetails(projectId, token);
                    const isProjectTeamLeader = projectDetails.teamLeaders?.some(
                        (leader: any) => leader.id === userId
                    );
                    setCanCreateTask(isProjectTeamLeader);

                    if (!isProjectTeamLeader) {
                        message.warning("Only Team Leaders assigned to this project can create tasks");
                    }
                } else {
                    setCanCreateTask(false);
                    message.warning("Only Admin and assigned Team Leaders can create tasks");
                }

                // Fetch project users
                const response = await fetchProjectUsers(projectId, token);
                setUsers(response);
            } catch (error) {
                message.error("Failed to fetch project details");
            }
        };

        checkPermissions();
    }, [token, projectId, userRole, userId]);

    const handleSubmit = async (values: any) => {
        if (!token || !canCreateTask) return;

        const dataToSend: FormData = {
            taskTitle: values.taskTitle,
            taskDescription: values.taskDescription,
            startDate: values.startDate.toISOString(),
            endDate: values.endDate.toISOString(),
            assignedUsers: values.assignedUsers || [],
        };

        try {
            setLoading(true);
            await createTask(projectId, dataToSend, token);
            message.success("Task created successfully!");
            onCancel();
        } catch (error) {
            message.error("Failed to create task.");
        } finally {
            setLoading(false);
        }
    };

    if (!canCreateTask) {
        return (
            <div style={{ padding: 24, background: "#fff", borderRadius: 8, textAlign: "center" }}>
                <Title level={4}>Access Denied</Title>
                <p>You don't have permission to create tasks for this project.</p>
                <Button onClick={onCancel}>Go Back</Button>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>
            <Title level={3}>Create New Task</Title>
            <Divider />
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    assignedUsers: [],
                }}
            >
                <Form.Item
                    label="Task Title"
                    name="taskTitle"
                    rules={[{ required: true, message: "Please enter the task title" }]}
                >
                    <Input placeholder="Enter task title" />
                </Form.Item>

                <Form.Item
                    label="Task Description"
                    name="taskDescription"
                    rules={[{ required: true, message: "Please enter the task description" }]}
                >
                    <TextArea rows={4} placeholder="Describe the task details" />
                </Form.Item>

                <Form.Item
                    label="Start Date"
                    name="startDate"
                    rules={[{ required: true, message: "Please select the start date" }]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="End Date"
                    name="endDate"
                    rules={[{ required: true, message: "Please select the end date" }]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Assign Team Members" name="assignedUsers">
                    <Checkbox.Group style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <Checkbox key={user.id} value={user.id}>
                                    {user.name}
                                </Checkbox>
                            ))
                        ) : (
                            <span>No users available</span>
                        )}
                    </Checkbox.Group>
                </Form.Item>

                <Form.Item>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Create Task
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </div>
    );
};

export default CreateTaskForm;