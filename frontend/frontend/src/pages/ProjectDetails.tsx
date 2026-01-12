import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    Button,
    Typography,
    Tag,
    Avatar,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Checkbox,
    Space,
    Divider,
    Row,
    Col,
    Spin,
    Alert,
    Tooltip,
    message,
    List,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    CalendarOutlined,
    TeamOutlined,
    FileTextOutlined,
    RestOutlined,
    ProjectOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import {
    fetchProjectDetails,
    updateProject,
    deleteProject,
    fetchUsers,
} from "../services/api";
import CreateTaskForm from "../components/createtask";
import TaskDetails from "./TaskDetails";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Updated interfaces with proper typing
interface User {
    id: string;
    name: string;
    email?: string;
    role?: string;
    isActive: boolean;
}

interface Project {
    id: string;
    title: string;
    description: string;
    projectStatus: "Pending" | "In Progress" | "Completed";
    category: string;
    startDate: string;
    endDate: string;
    teamLeaders: User[];
    assignedUsers: User[];
}

interface AuthContextType {
    user: {
        id: string;
        token: string;
        role: string;
        name: string;
    } | null;
}

interface EditData {
    title: string;
    description: string;
    projectStatus: "Pending" | "In Progress" | "Completed";
    startDate: string;
    endDate: string;
    teamLeaders: string[];
    assignedUsers: string[];
    isDelete?: boolean;
}

interface UsersResponse {
    users: User[];
    pagination?: any;
}

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) as AuthContextType;
    const token = user?.token;
    const userRole = user?.role;
    const userId = user?.id;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [showForm, setShowForm] = useState<boolean>(false);
    const [showEditForm, setShowEditForm] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [editData, setEditData] = useState<EditData>({
        title: "",
        description: "",
        projectStatus: "Pending",
        startDate: "",
        endDate: "",
        teamLeaders: [],
        assignedUsers: [],
    });
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [editForm] = Form.useForm();
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [canManageProject, setCanManageProject] = useState<boolean>(false);

    useEffect(() => {
        const getProjectDetails = async (): Promise<void> => {
            if (!token || !projectId) return;
            try {
                setLoading(true);
                const data = await fetchProjectDetails(projectId, token);

                const normalizedProject: Project = {
                    id: data.id,
                    title: data.title ?? "",
                    description: data.description ?? "",
                    projectStatus: (["Pending", "In Progress", "Completed"].includes(data.projectStatus)
                        ? data.projectStatus
                        : "Pending") as "Pending" | "In Progress" | "Completed",
                    category: data.category ?? "",
                    startDate: data.startDate ?? "",
                    endDate: data.endDate ?? "",
                    teamLeaders: (data.teamLeaders ?? []).map((u: any) => ({
                        id: u.id || u.Id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        isActive: u.isActive !== undefined ? u.isActive : true,
                    })),
                    assignedUsers: (data.assignedUsers ?? []).map((u: any) => ({
                        id: u.id || u.Id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        isActive: u.isActive !== undefined ? u.isActive : true,
                    })),
                };

                setProject(normalizedProject);

                // Check if current user can manage this project
                const isAdmin = userRole === "admin";
                const isTeamLeader = userRole === "teamleader" &&
                    normalizedProject.teamLeaders.some(leader => leader.id === userId);

                setCanManageProject(isAdmin || isTeamLeader);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching project:", err);
                setError("Failed to load project details.");
                setLoading(false);
                message.error("Failed to load project details.");
            }
        };

        const getUsers = async (): Promise<void> => {
            if (!token) return;
            try {
                const params = {
                    page: 1,
                    perPage: 1000, // Get more users
                    isActive: true
                };

               // const apiResponse = await fetchUsers(token, params);

               

                const apiResponse = await fetchUsers(token, params);
                // Handle both response structures
                const usersArray = apiResponse.users || apiResponse.data || apiResponse.Data || [];
                const normalizedUsers: User[] = (apiResponse.users ?? []) || usersArray.map((u: any) => ({
                    id: u.id || u.Id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive !== undefined ? u.isActive : true,
                }));
                setAllUsers(normalizedUsers);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                message.error("Failed to fetch users.");
            }
        };

        getProjectDetails();
        getUsers();
    }, [projectId, token, userRole, userId]);

    const handleDelete = async (): Promise<void> => {
        if (!projectId || !token) return;
        try {
            setDeleteLoading(true);
            await deleteProject(projectId, token);
            message.success("Project deleted successfully!");
            navigate("/dashboard");
        } catch (err) {
            console.error("Failed to delete project:", err);
            message.error("Failed to delete project.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditClick = (): void => {
        if (!project) return;

        // Prepare form data with proper date handling
        const formData: any = {
            title: project.title,
            description: project.description,
            projectStatus: project.projectStatus,
            category: project.category,
            // DatePicker expects dayjs objects
            startDate: project.startDate ? dayjs(project.startDate) : null,
            endDate: project.endDate ? dayjs(project.endDate) : null,
            teamLeaders: project.teamLeaders?.map((u) => u.id) || [],
            assignedUsers: project.assignedUsers?.map((u) => u.id) || [],
        };

        // Set edit data for tracking
        setEditData({
            title: project.title,
            description: project.description,
            projectStatus: project.projectStatus,
            startDate: project.startDate ? project.startDate.split("T")[0] : "",
            endDate: project.endDate ? project.endDate.split("T")[0] : "",
            teamLeaders: project.teamLeaders?.map((u) => u.id) || [],
            assignedUsers: project.assignedUsers?.map((u) => u.id) || [],
            isDelete: false
        });

        // Set form values
        editForm.setFieldsValue(formData);
        setShowEditForm(true);
    };

    // Complete handleSaveEdit function with proper screen refresh

    // Alternative fix if your backend expects different field names

    // Fixed handleSaveEdit method for ProjectDetails.tsx

    const handleSaveEdit = async (values: any): Promise<void> => {
        if (!token || !projectId || !project) return;

        try {
            setSaveLoading(true);

            // Prepare the update data based on user role
            let dataToSend: any = {};

            if (userRole === "admin") {
                // Admin can update everything
                dataToSend = {
                    title: values.title,
                    description: values.description,
                    projectStatus: values.projectStatus,
                    category: values.category,
                    teamLeaders: values.teamLeaders || [],
                    assignedUsers: values.assignedUsers || [],
                    // Convert dayjs objects to ISO strings
                    startDate: values.startDate ?
                        (values.startDate.toISOString ? values.startDate.toISOString() : values.startDate) :
                        project.startDate,
                    endDate: values.endDate ?
                        (values.endDate.toISOString ? values.endDate.toISOString() : values.endDate) :
                        project.endDate,
                    isDelete: editData.isDelete || false,
                };
            } else if (userRole === "teamleader") {
                // Team Leader can only update specific fields
                dataToSend = {
                    // Fields TL CANNOT change - send existing values
                    title: project.title,
                    category: project.category,
                    teamLeaders: project.teamLeaders.map(u => u.id),
                    startDate: project.startDate,
                    isDelete: false,

                    // Fields TL CAN change - send new values
                    description: values.description || project.description,
                    projectStatus: values.projectStatus || project.projectStatus,
                    assignedUsers: values.assignedUsers || [],
                    // Convert dayjs object to ISO string
                    endDate: values.endDate ?
                        (values.endDate.toISOString ? values.endDate.toISOString() : values.endDate) :
                        project.endDate,
                };
            }

            console.log("Sending update data:", JSON.stringify(dataToSend, null, 2));

            // Send the update request
            const response = await updateProject(projectId, dataToSend, token);
            console.log("Update response:", response);

            // Success - close modal and refresh
            setShowEditForm(false);
            editForm.resetFields();
            message.success("Project updated successfully!");

            // Refresh the project data
            setTimeout(async () => {
                await forceRefreshProject();
            }, 500);

        } catch (error: any) {
            console.error("Update failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "Update failed";
            message.error(`Failed to update project: ${errorMessage}`);
        } finally {
            setSaveLoading(false);
        }
    };
    // Also add a force refresh function that can be called if needed
    const forceRefreshProject = async () => {
        try {
            setLoading(true);
            const data = await fetchProjectDetails(projectId, token);

            const normalizedProject: Project = {
                id: data.id || data.Id,
                title: data.title ?? "",
                description: data.description ?? "",
                category: data.category ?? "",
                projectStatus: (["Pending", "In Progress", "Completed"].includes(data.projectStatus)
                    ? data.projectStatus
                    : "Pending") as "Pending" | "In Progress" | "Completed",
                startDate: data.startDate ?? "",
                endDate: data.endDate ?? "",
                teamLeaders: (data.teamLeaders ?? []).map((u: any) => ({
                    id: u.id || u.Id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive !== undefined ? u.isActive : true,
                })),
                assignedUsers: (data.assignedUsers ?? []).map((u: any) => ({
                    id: u.id || u.Id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive !== undefined ? u.isActive : true,
                })),
            };

            setProject(normalizedProject);
            setLoading(false);
            message.info("Project data refreshed");
        } catch (err) {
            setLoading(false);
            message.error("Failed to refresh project");
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case "Completed":
                return "success";
            case "Pending":
                return "warning";
            case "In Progress":
                return "processing";
            default:
                return "default";
        }
    };

    const refreshProject = async () => {
        if (!token || !projectId) return;
        try {
            const data = await fetchProjectDetails(projectId, token);
            const normalizedProject: Project = {
                id: data.id,
                title: data.title ?? "",
                description: data.description ?? "",
                projectStatus: data.projectStatus ?? "Pending",
                category: data.category ?? "",
                startDate: data.startDate ?? "",
                endDate: data.endDate ?? "",
                teamLeaders: (data.teamLeaders ?? []).map((u: any) => ({
                    id: u.id || u.Id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive !== undefined ? u.isActive : true,
                })),
                assignedUsers: (data.assignedUsers ?? []).map((u: any) => ({
                    id: u.id || u.Id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive !== undefined ? u.isActive : true,
                })),
            };
            setProject(normalizedProject);
            message.success("Project refreshed");
        } catch (err) {
            message.error("Failed to refresh project");
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <Spin size="large" />
                <Text>Loading project details...</Text>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "24px" }}>
                <Alert message={error} type="error" showIcon />
            </div>
        );
    }

    if (!project) {
        return (
            <div style={{ padding: "24px" }}>
                <Alert message="No project found." type="info" showIcon />
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            {/* Project Header Card */}
            <Card
                style={{ marginBottom: "24px" }}
                bodyStyle={{ padding: "24px" }}
            >
                <Row justify="space-between" align="top" gutter={[24, 16]}>
                    <Col xs={24} lg={18}>
                        <div>
                            <Title level={1} style={{ marginBottom: "12px", color: "#1890ff" }}>
                                <ProjectOutlined style={{ marginRight: "8px" }} />
                                {project.title}
                            </Title>
                            <Space size="middle" wrap>
                                <Tag
                                    color={getStatusColor(project.projectStatus)}
                                    style={{ fontSize: "14px", padding: "4px 12px", borderRadius: "16px" }}
                                >
                                    {project.projectStatus}
                                </Tag>
                                <Tag
                                    color="blue"
                                    style={{ fontSize: "14px", padding: "4px 12px", borderRadius: "16px" }}
                                >
                                    {project.category}
                                </Tag>
                            </Space>
                        </div>
                    </Col>

                    {canManageProject && (
                        <Col xs={24} lg={6} style={{ textAlign: "right" }}>
                            <Space>
                                <Tooltip title="Refresh">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={refreshProject}
                                        size="large"
                                    />
                                </Tooltip>
                                <Tooltip title="Edit Project">
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={handleEditClick}
                                        size="large"
                                    >
                                        Edit
                                    </Button>
                                </Tooltip>
                                {userRole === "admin" && (
                                    <Tooltip title="Delete Project">
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => setShowDeleteConfirm(true)}
                                            size="large"
                                        >
                                            Delete
                                        </Button>
                                    </Tooltip>
                                )}
                            </Space>
                        </Col>
                    )}
                </Row>
            </Card>

            {/* Project Details Card */}
            <Card
                title={
                    <Title level={3} style={{ margin: 0 }}>
                        <FileTextOutlined style={{ marginRight: "8px" }} />
                        Project Details
                    </Title>
                }
                style={{ marginBottom: "24px" }}
                bodyStyle={{ padding: "24px" }}
            >
                <Row gutter={[32, 24]}>
                    <Col xs={24} lg={14}>
                        <div>
                            <Title level={4} style={{ color: "#595959", marginBottom: "16px" }}>
                                Description
                            </Title>
                            <Paragraph
                                style={{
                                    fontSize: "16px",
                                    lineHeight: "1.6",
                                    color: "#434343",
                                    backgroundColor: "#fafafa",
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: "1px solid #f0f0f0"
                                }}
                            >
                                {project.description}
                            </Paragraph>
                        </div>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <Card
                                    size="small"
                                    title={
                                        <Title level={4} style={{ margin: 0, color: "#595959" }}>
                                            <CalendarOutlined style={{ marginRight: "8px" }} />
                                            Timeline
                                        </Title>
                                    }
                                    style={{ height: "fit-content" }}
                                >
                                    <div style={{ padding: "8px 0" }}>
                                        <Row gutter={[0, 12]}>
                                            <Col span={24}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Text strong style={{ color: "#595959" }}>Start Date:</Text>
                                                    <Text style={{ fontSize: "16px" }}>
                                                        {project.startDate ? new Date(project.startDate).toLocaleDateString("en-GB", {
                                                            timeZone: "UTC",
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        }) : "Not set"}
                                                    </Text>
                                                </div>
                                            </Col>
                                            <Col span={24}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Text strong style={{ color: "#595959" }}>End Date:</Text>
                                                    <Text style={{ fontSize: "16px" }}>
                                                        {project.endDate ? new Date(project.endDate).toLocaleDateString("en-GB", {
                                                            timeZone: "UTC",
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        }) : "Not set"}
                                                    </Text>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Card>
                            </Col>

                            {/* Team Leaders Card */}
                            <Col span={24}>
                                <Card
                                    size="small"
                                    title={
                                        <Title level={4} style={{ margin: 0, color: "#595959" }}>
                                            <TeamOutlined style={{ marginRight: "8px" }} />
                                            Team Leaders ({project.teamLeaders?.length || 0})
                                        </Title>
                                    }
                                    style={{ marginBottom: 16 }}
                                >
                                    {project.teamLeaders && project.teamLeaders.length > 0 ? (
                                        <List
                                            dataSource={project.teamLeaders}
                                            renderItem={(leader) => (
                                                <List.Item style={{ padding: "8px 0", border: "none" }}>
                                                    <List.Item.Meta
                                                        avatar={
                                                            <Avatar style={{ backgroundColor: '#7c3aed' }}>
                                                                {leader.name?.charAt(0).toUpperCase() || "?"}
                                                            </Avatar>
                                                        }
                                                        title={
                                                            <Space>
                                                                <Text style={{ fontSize: "16px", fontWeight: "500" }}>
                                                                    {leader.name || "Unknown"}
                                                                </Text>
                                                                {leader.id === userId && (
                                                                    <Tag color="green">You</Tag>
                                                                )}
                                                            </Space>
                                                        }
                                                        description={
                                                            <Space>
                                                                <Tag color="purple">
                                                                    {leader.role === 'admin' ? 'Admin' : 'Team Leader'}
                                                                </Tag>
                                                                {leader.email && (
                                                                    <Text type="secondary" style={{ fontSize: "12px" }}>
                                                                        {leader.email}
                                                                    </Text>
                                                                )}
                                                            </Space>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "20px" }}>
                                            <Text type="secondary">No team leaders assigned</Text>
                                        </div>
                                    )}
                                </Card>
                            </Col>

                            {/* Team Members Card */}
                            <Col span={24}>
                                <Card
                                    size="small"
                                    title={
                                        <Title level={4} style={{ margin: 0, color: "#595959" }}>
                                            <TeamOutlined style={{ marginRight: "8px" }} />
                                            Team Members ({project.assignedUsers?.length || 0})
                                        </Title>
                                    }
                                    style={{ height: "fit-content" }}
                                >
                                    {project.assignedUsers && project.assignedUsers.length > 0 ? (
                                        <div style={{ padding: "8px 0" }}>
                                            <List
                                                dataSource={project.assignedUsers}
                                                renderItem={(member) => (
                                                    <List.Item style={{ padding: "8px 0", border: "none" }}>
                                                        <List.Item.Meta
                                                            avatar={
                                                                <Avatar
                                                                    size="large"
                                                                    style={{
                                                                        backgroundColor: "#1890ff",
                                                                        fontSize: "16px",
                                                                        fontWeight: "bold"
                                                                    }}
                                                                >
                                                                    {member.name?.charAt(0).toUpperCase() || "?"}
                                                                </Avatar>
                                                            }
                                                            title={
                                                                <Space>
                                                                    <Text style={{ fontSize: "16px", fontWeight: "500" }}>
                                                                        {member.name || "Unknown"}
                                                                    </Text>
                                                                    {member.id === userId && (
                                                                        <Tag color="green">You</Tag>
                                                                    )}
                                                                </Space>
                                                            }
                                                            description={
                                                                member.email && (
                                                                    <Text type="secondary" style={{ fontSize: "12px" }}>
                                                                        {member.email}
                                                                    </Text>
                                                                )
                                                            }
                                                        />
                                                    </List.Item>
                                                )}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "20px" }}>
                                            <Text type="secondary" style={{ fontSize: "16px" }}>
                                                No team members assigned
                                            </Text>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>

            {/* Tasks Card */}
            <Card
                title={
                    <Title level={3} style={{ margin: 0 }}>
                        <FileTextOutlined style={{ marginRight: "8px" }} />
                        Task Management
                    </Title>
                }
                extra={
                    canManageProject && !showForm ? (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setShowForm(true)}
                            size="large"
                        >
                            Add New Task
                        </Button>
                    ) : null
                }
                bodyStyle={{ padding: "24px" }}
            >
                {showForm && (
                    <div style={{ marginBottom: "24px" }}>
                        <Alert
                            message="Create New Task"
                            description="Fill in the details below to create a new task for this project."
                            type="info"
                            showIcon
                            style={{ marginBottom: "16px" }}
                        />
                        <CreateTaskForm
                            projectId={projectId || ""}
                            onCancel={() => setShowForm(false)}
                        />
                        <Divider />
                    </div>
                )}

                <TaskDetails projectId={projectId || ""} />
            </Card>

            {/* Edit Modal */}
            <Modal
                title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <Space>
                            <EditOutlined />
                            <span>Edit Project</span>
                        </Space>
                        {userRole === "admin" && (
                            <Button
                                type={editData.isDelete ? "default" : "text"}
                                danger={!editData.isDelete}
                                size="small"
                                icon={editData.isDelete ? <RestOutlined /> : <DeleteOutlined />}
                                onClick={() =>
                                    setEditData({ ...editData, isDelete: !editData.isDelete })
                                }
                            >
                                {editData.isDelete ? "Restore" : "Move to Bin"}
                            </Button>
                        )}
                    </div>
                }
                open={showEditForm}
                onCancel={() => {
                    setShowEditForm(false);
                    editForm.resetFields();
                }}
                footer={[
                    <Button key="cancel" size="large" onClick={() => {
                        setShowEditForm(false);
                        editForm.resetFields();
                    }}>
                        Cancel
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        size="large"
                        loading={saveLoading}
                        onClick={() => editForm.submit()}
                    >
                        Save Changes
                    </Button>,
                ]}
                width={900}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleSaveEdit}
                    size="large"
                >
                    <Row gutter={[16, 0]}>
                        {/* Title - Only Admin can edit */}
                        {userRole === "admin" ? (
                            <Col span={24}>
                                <Form.Item
                                    label="Project Title"
                                    name="title"
                                    rules={[{ required: true, message: "Please enter project title" }]}
                                >
                                    <Input placeholder="Enter project title" />
                                </Form.Item>
                            </Col>
                        ) : (
                            <Col span={24}>
                                <Form.Item label="Project Title">
                                    <Input
                                        value={project?.title}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5' }}
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        {/* Description - Both Admin and Team Leader can edit */}
                        <Col span={24}>
                            <Form.Item
                                label="Description"
                                name="description"
                                rules={[{ required: true, message: "Please enter description" }]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Enter project description"
                                />
                            </Form.Item>
                        </Col>

                        {/* Category - Only Admin can edit */}
                        {userRole === "admin" ? (
                            <Col span={24}>
                                <Form.Item
                                    label="Category"
                                    name="category"
                                    rules={[{ required: true, message: "Please select a category" }]}
                                >
                                    <Select placeholder="Select a category">
                                        {[
                                            "Intern", "Trainee", "ASE", "CyberSecurity Dept.", "Web Development",
                                            "App Development", "Mobile App", "Data Science", "UI/UX Design",
                                            "Marketing", "Finance", "Manual Testing", "Automation Testing",
                                            "Frontend Development", "Backend Development"
                                        ].map((cat) => (
                                            <Option key={cat} value={cat}>
                                                {cat}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        ) : (
                            <Col span={24}>
                                <Form.Item label="Category">
                                    <Input
                                        value={project?.category}
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5' }}
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        {/* Team Leaders Selection - Only for Admin */}
                        {userRole === "admin" && (
                            <Col span={24}>
                                <Form.Item
                                    label="Team Leaders"
                                    name="teamLeaders"
                                >
                                    <Checkbox.Group style={{ width: "100%" }}>
                                        <div style={{
                                            maxHeight: "200px",
                                            overflowY: "auto",
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "8px",
                                            padding: "12px",
                                            backgroundColor: "#f0f5ff"
                                        }}>
                                            <Row gutter={[16, 12]}>
                                                {allUsers
                                                    .filter(u => u.role === 'teamleader' || u.role === 'admin')
                                                    .map((u) => {
                                                        const isAssigned = project?.teamLeaders?.some(
                                                            leader => leader.id === u.id
                                                        );

                                                        return (
                                                            <Col span={12} key={u.id}>
                                                                <Checkbox
                                                                    value={u.id}
                                                                    disabled={!u.isActive}
                                                                    defaultChecked={isAssigned}
                                                                    style={{
                                                                        color: !u.isActive ? "#ccc" : "inherit",
                                                                        fontWeight: isAssigned ? "bold" : "normal"
                                                                    }}
                                                                >
                                                                    <Space>
                                                                        <Avatar size="small" style={{ backgroundColor: '#7c3aed' }}>
                                                                            {u.name?.charAt(0).toUpperCase() || "?"}
                                                                        </Avatar>
                                                                        <span>
                                                                            {u.name || "Unknown User"}
                                                                            {isAssigned && (
                                                                                <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>
                                                                                    Current
                                                                                </Tag>
                                                                            )}
                                                                            <Tag color="purple" style={{ marginLeft: 4, fontSize: 10 }}>
                                                                                {u.role === 'admin' ? 'Admin' : 'TL'}
                                                                            </Tag>
                                                                            {!u.isActive && <Text type="secondary">(Inactive)</Text>}
                                                                        </span>
                                                                    </Space>
                                                                </Checkbox>
                                                            </Col>
                                                        );
                                                    })}
                                            </Row>
                                        </div>
                                    </Checkbox.Group>
                                </Form.Item>
                            </Col>
                        )}

                        {/* Team Members Selection - Both Admin and Team Leaders can edit */}
                        <Col span={24}>
                            <Form.Item
                                label="Team Members"
                                name="assignedUsers"
                            >
                                <Checkbox.Group style={{ width: "100%" }}>
                                    <div style={{
                                        maxHeight: "300px",
                                        overflowY: "auto",
                                        border: "1px solid #d9d9d9",
                                        borderRadius: "8px",
                                        padding: "12px"
                                    }}>
                                        <Row gutter={[16, 12]}>
                                            {allUsers
                                                .filter(u => {
                                                    if (userRole === 'admin' || userRole === 'teamleader') {
                                                        return true; // Show all users
                                                    }
                                                    return u.role === 'user';
                                                })
                                                .map((u) => {
                                                    const isAssigned = project?.assignedUsers?.some(
                                                        assigned => assigned.id === u.id
                                                    );

                                                    return (
                                                        <Col span={12} key={u.id}>
                                                            <Checkbox
                                                                value={u.id}
                                                                disabled={!u.isActive}
                                                                defaultChecked={isAssigned}
                                                                style={{
                                                                    color: !u.isActive ? "#ccc" : "inherit",
                                                                    fontWeight: isAssigned ? "bold" : "normal"
                                                                }}
                                                            >
                                                                <Space>
                                                                    <Avatar size="small" style={{
                                                                        backgroundColor:
                                                                            u.role === 'teamleader' ? '#7c3aed' :
                                                                                u.role === 'admin' ? '#ff4d4f' : '#1890ff'
                                                                    }}>
                                                                        {u.name?.charAt(0).toUpperCase() || "?"}
                                                                    </Avatar>
                                                                    <span>
                                                                        {u.name || "Unknown User"}
                                                                        {isAssigned && (
                                                                            <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>
                                                                                Current
                                                                            </Tag>
                                                                        )}
                                                                        {u.role !== 'user' && (
                                                                            <Tag
                                                                                color={
                                                                                    u.role === 'teamleader' ? 'purple' :
                                                                                        u.role === 'admin' ? 'red' : 'blue'
                                                                                }
                                                                                style={{ marginLeft: 4, fontSize: 10 }}
                                                                            >
                                                                                {u.role === 'admin' ? 'Admin' :
                                                                                    u.role === 'teamleader' ? 'TL' : 'User'}
                                                                            </Tag>
                                                                        )}
                                                                        {!u.isActive && <Text type="secondary">(Inactive)</Text>}
                                                                    </span>
                                                                </Space>
                                                            </Checkbox>
                                                        </Col>
                                                    );
                                                })}
                                        </Row>
                                    </div>
                                </Checkbox.Group>
                            </Form.Item>
                        </Col>


                        {/* Status - Both Admin and Team Leaders can edit */}
                        <Col span={8}>
                            <Form.Item
                                label="Status"
                                name="projectStatus"
                                rules={[{ required: true, message: "Please select status" }]}
                            >
                                <Select placeholder="Select status">
                                    <Option value="Pending">Pending</Option>
                                    <Option value="In Progress">In Progress</Option>
                                    <Option value="Completed">Completed</Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        {/* Start Date - Only Admin can edit */}
                        {userRole === "admin" ? (
                            <Col span={8}>
                                <Form.Item
                                    label="Start Date"
                                    name="startDate"
                                    rules={[{ required: true, message: "Please select start date" }]}
                                >
                                    <DatePicker style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                        ) : (
                            <Col span={8}>
                                <Form.Item label="Start Date">
                                    <DatePicker
                                        style={{ width: "100%" }}
                                        value={project?.startDate ? dayjs(project.startDate) : null}
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        {/* End Date - Both Admin and Team Leaders can edit */}
                        <Col span={8}>
                            <Form.Item
                                label="End Date"
                                name="endDate"
                                rules={[{ required: true, message: "Please select end date" }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Alert message for Team Leaders */}
                    {userRole === "teamleader" && (
                        <Alert
                            message="Limited Edit Access"
                            description="As a Team Leader, you can edit: Description, Status, End Date, and Team Members. Project Title, Category, Start Date, and Team Leader assignments can only be modified by Administrators."
                            type="info"
                            showIcon
                            style={{ marginTop: 24 }}
                        />
                    )}
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title={
                    <Space>
                        <DeleteOutlined style={{ color: "#ff4d4f" }} />
                        <span>Confirm Deletion</span>
                    </Space>
                }
                open={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                footer={[
                    <Button key="cancel" size="large" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="delete"
                        type="primary"
                        danger
                        size="large"
                        loading={deleteLoading}
                        onClick={handleDelete}
                    >
                        Delete Project
                    </Button>,
                ]}
                width={500}
            >
                <div style={{ padding: "20px 0" }}>
                    <Alert
                        message="Are you sure you want to delete this project?"
                        description="This action cannot be undone and will permanently remove the project and all associated data."
                        type="warning"
                        showIcon
                        style={{ marginBottom: "20px" }}
                    />
                    <div style={{ textAlign: "center" }}>
                        <Title level={4} style={{ color: "#595959" }}>
                            "{project.title}"
                        </Title>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProjectDetails;