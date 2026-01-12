import React, { useEffect, useState, useContext, useCallback } from "react";
import {
    Layout,
    Menu,
    Avatar,
    Typography,
    Button,
    Table,
    Card,
    Input,
    Select,
    Checkbox,
    Modal,
    Form,
    Row,
    Col,
    Tag,
    Space,
    Pagination,
    Spin,
    Empty,
    Badge,
    Tooltip,
    Grid,
    message,
    Alert
} from "antd";
import {
    DashboardOutlined,
    UserOutlined,
    ProjectOutlined,
    LogoutOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined,
    CalendarOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    LoadingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ReloadOutlined
} from "@ant-design/icons";
import AuthContext from "../context/AuthContext";
import {
    fetchProjects,
    fetchUsers,
    updateUser,
    deleteUser,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import CreateProjectForm from "../components/createproject";
import CreateUser from "../components/createuser";

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'teamleader';
    designation?: string;
    isActive: boolean;
    emailVerified?: boolean;
    createdBy?: string; // Track who created the user
    [key: string]: any;
}

interface Project {
    id: string;
    title: string;
    description: string;
    projectStatus: 'Pending' | 'In Progress' | 'Completed';
    category: string;
    startDate: string;
    endDate: string;
    isDelete?: boolean;
}

interface AuthContextType {
    user: User | null;
    logout: () => void;
}

interface Pagination {
    currentPage: number;
    perPage: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface Filters {
    search: string;
    role: string;
    designation?: string; 
    isActive: boolean;
    sortBy: string;
    sortDescending: boolean;
}

interface ProjectFilters {
    search: string;
    status: string;
    category: string;
    isDeleted: boolean | undefined;
    sortBy: string;
    sortDescending: boolean;
}

interface FormData {
    name: string;
    email: string;
    role: string;
    designation?: string;
    isActive: boolean;
}

const Dashboard: React.FC = () => {
    const { user, logout } = useContext(AuthContext) as any;
    const screens = useBreakpoint();
    const [collapsed, setCollapsed] = useState(!screens.lg);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<string>("projects");
    const [editUser, setEditUser] = useState<string | null>(null);
    const [form] = Form.useForm();
    const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [confirmLogout, setConfirmLogout] = useState<boolean>(false);

    const [filters, setFilters] = useState<Filters>({
        search: '',
        role: '',
        isActive: true,
        sortBy: 'name',
        sortDescending: false
    });

    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        perPage: 10,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const [projectFilters, setProjectFilters] = useState<ProjectFilters>({
        search: '',
        status: '',
        category: '',
        isDeleted: undefined,
        sortBy: 'title',
        sortDescending: false
    });

    const [projectPagination, setProjectPagination] = useState<Pagination>({
        currentPage: 1,
        perPage: 6,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
    const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
    const [loadingUpdate, setLoadingUpdate] = useState<boolean>(false);

    const navigate = useNavigate();

    const loadProjects = useCallback(async () => {
        if (!user?.token) return;

        setLoadingProjects(true);
        try {
            const data = await fetchProjects(user.token, {
                ...projectFilters,
                page: projectPagination.currentPage,
                perPage: projectPagination.perPage
            });

            if (data?.projects) {
                setProjects(
                    data.projects.map((p: any) => ({
                        ...p,
                        projectStatus:
                            p.projectStatus === "Pending" ||
                                p.projectStatus === "In Progress" ||
                                p.projectStatus === "Completed"
                                ? p.projectStatus
                                : "Pending"
                    }))
                );
                setProjectPagination(data.pagination || projectPagination);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            message.error("Failed to load projects");
        } finally {
            setLoadingProjects(false);
        }
    }, [user?.token, projectFilters, projectPagination.currentPage, projectPagination.perPage]);

    const loadUsers = useCallback(async () => {
        if (!user?.token) {
            console.log("No token, skipping load");
            return;
        }
        console.log("Loading users with role:", user?.role);
        console.log("Loading users - Page:", pagination.currentPage, "PerPage:", pagination.perPage);
        setLoadingUsers(true);
       // setLoadingUsers(true);
        try {
            // Basic parameters - no filtering on frontend
            const params:any = {
                page: pagination.currentPage,
                perPage: pagination.perPage,
                search: filters.search || '',
                role: filters.role || '',
                designation: filters.designation || '',
                isActive: filters.isActive,
                sortBy: filters.sortBy || 'name',
                sortDescending: filters.sortDescending || false
            };

            //const response = await fetchUsers(user.token, params);

            console.log("Request params:", params);
            const response = await fetchUsers(user.token, params);
            console.log("Response received:", response);

            if (response?.users) {
                // Just set the users directly - let backend handle filtering
                setUsers(response.users || []);
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination,
                    // Ensure current page and perPage are preserved
                    currentPage: response.pagination.currentPage || prev.currentPage,
                    perPage: response.pagination.perPage || prev.perPage
                }));
                //setPagination(response.pagination || {
                //    currentPage: 1,
                //    perPage: 100,
                //    totalCount: response.users?.length || 0,
                //    totalPages: 1,
                //    hasNextPage: false,
                //    hasPreviousPage: false
                //});
            } else {
                // If no users in response, set empty array
                setUsers([]);
            }
        } catch (error) {
            message.error("Failed to load users");
            setUsers([]); // Set empty array on error
        } finally {
            setLoadingUsers(false);
        }
    }, [user?.token, filters, pagination.currentPage, pagination.perPage]);

    // Load data based on active tab
    useEffect(() => {
        if (user?.token) {
            if (activeTab === "projects") {
                loadProjects();
            } else if (activeTab === "users" && (user?.role === "admin" || user?.role === "teamleader")) {
                loadUsers();
            }
        }
    }, [activeTab, user?.token, user?.role]);

    // Reload users after creating a new user
    const handleUserCreated = useCallback(() => {
        setShowCreateUserModal(false);
        // Force reload of users
        loadUsers();
        message.success("User created successfully! Refreshing list...");
    }, [loadUsers]);

    // Separate useEffect for pagination changes
    useEffect(() => {
        if (user?.token && activeTab === "projects") {
            loadProjects();
        }
    }, [projectPagination.currentPage, projectPagination.perPage]);

    useEffect(() => {
        if (user?.token && activeTab === "users" && (user?.role === "admin" || user?.role === "teamleader")) {
            loadUsers();
        }
    }, [pagination.currentPage, pagination.perPage]);

    // Debounced filter effects
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user?.token && activeTab === "users" && (user?.role === "admin" || user?.role === "teamleader")) {
                setPagination(prev => ({ ...prev, currentPage: 1 }));
                loadUsers();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters.search, filters.role, filters.designation, filters.isActive, filters.sortBy, filters.sortDescending]);

    // Add this separate useEffect for pagination changes:
    useEffect(() => {
        if (user?.token && activeTab === "users" && (user?.role === "admin" || user?.role === "teamleader")) {
            loadUsers();
        }
    }, [pagination.currentPage, pagination.perPage, loadUsers]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user?.token && activeTab === "projects") {
                setProjectPagination(prev => ({ ...prev, currentPage: 1 }));
                loadProjects();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [projectFilters.search, projectFilters.status, projectFilters.category, projectFilters.sortBy, projectFilters.sortDescending]);

    const handleUpdateSubmit = async (values: FormData): Promise<void> => {
        if (!editUser || !user?.token) {
            message.error("Invalid user or token");
            return;
        }

        setLoadingUpdate(true);
        try {

            const updateData = {
                name: values.name,
                email: values.email,
                role: values.role,
                designation: values.designation, // ADD THIS
                isActive: values.isActive
            };

            await updateUser(editUser, updateData, user.token);
            await loadUsers();
            message.success("User updated successfully");
            setEditUser(null);
            form.resetFields();
        } catch (error: any) {
            console.error("Error updating user:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to update user";
            message.error(errorMessage);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleDelete = async (userId: string): Promise<void> => {
        if (!user?.token) {
            message.error("Invalid token");
            return;
        }

        try {
            await deleteUser(userId, user.token);
            await loadUsers();
            message.success("User deleted successfully");
            setConfirmDelete(null);
        } catch (error: any) {
            console.error("Error deleting user:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete user";
            message.error(errorMessage);
        }
    };

    const handleLogout = (): void => {
        logout();
        message.success("Logged out successfully");
        setConfirmLogout(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'In Progress':
                return <LoadingOutlined style={{ color: '#1890ff' }} />;
            case 'Pending':
                return <ClockCircleOutlined style={{ color: '#faad14' }} />;
            default:
                return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'success';
            case 'In Progress':
                return 'processing';
            case 'Pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    const userColumns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: User) => (
                <Space>
                    <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                        {text?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        {record.designation && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {record.designation}
                            </Text>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text: string, record: User) => (
                <div>
                    <div>{text}</div>
                    {record.emailVerified && (
                        <Badge
                            count={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            style={{ backgroundColor: 'transparent' }}
                        >
                            <Text type="secondary" style={{ fontSize: '12px' }}>Verified</Text>
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                const getColor = () => {
                    switch (role) {
                        case 'admin': return 'red';
                        case 'teamleader': return 'purple';
                        default: return 'blue';
                    }
                };
                const getLabel = () => {
                    switch (role) {
                        case 'admin': return 'Admin';
                        case 'teamleader': return 'Team Leader';
                        default: return 'User';
                    }
                };
                return (
                    <Tag color={getColor()}>
                        {getLabel()}
                    </Tag>
                );
            },
        },

        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            render: (designation: string) => (
                <Tag color="cyan">
                    {designation || 'Not Assigned'}
                </Tag>
            ),
        },

        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'success' : 'error'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text: any, record: User) => {
                // Determine if current user can modify this user
                const canModifyUser = user?.role === 'admin' ||
                    (user?.role === 'teamleader' && record.role === 'user');

                if (!canModifyUser) {
                    return (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.role === 'admin' || record.role === 'teamleader'
                                ? 'Protected user'
                                : 'No actions available'}
                        </Text>
                    );
                }

                return (
                    <Space size="middle">
                        <Tooltip title="Edit">
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => {
                                    setEditUser(record.id);
                                    form.setFieldsValue({
                                        name: record.name || '',
                                        email: record.email || '',
                                        role: record.role || 'user',
                                        designation: record.designation || 'Employee',
                                        isActive: record.isActive ?? true,
                                    });
                                }}
                            />
                        </Tooltip>
                        <Tooltip title="Delete">
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => setConfirmDelete(record.id)}
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    const menuItems = [
        {
            key: 'projects',
            icon: <ProjectOutlined />,
            label: 'Projects',
        },
        // Show Members tab for both Admin and Team Leaders
        ...(user?.role === 'admin' || user?.role === 'teamleader' ? [{
            key: 'users',
            icon: <UserOutlined />,
            label: 'Members',
        }] : []),
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                breakpoint="lg"
                onBreakpoint={(broken) => {
                    setCollapsed(broken);
                }}
                style={{
                    background: '#fff',
                    boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100
                }}
            >
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    height: '64px'
                }}>
                    <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    {!collapsed && (
                        <Title level={4} style={{ margin: '0 0 0 12px', color: '#1890ff' }}>
                            Dashboard
                        </Title>
                    )}
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[activeTab]}
                    style={{ border: 'none', height: 'calc(100vh - 160px)', overflow: 'auto' }}
                    items={menuItems}
                    onClick={({ key }) => setActiveTab(key)}
                />

                <div style={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16
                }}>
                    <Button
                        type="text"
                        icon={<LogoutOutlined />}
                        onClick={() => setConfirmLogout(true)}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            color: '#ff4d4f',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start'
                        }}
                    >
                        {!collapsed && 'Logout'}
                    </Button>
                </div>
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
                <Header style={{
                    padding: '0 24px',
                    background: '#fff',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    left: collapsed ? 80 : 200,
                    zIndex: 99,
                    transition: 'left 0.2s'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 40,
                                height: 40,
                                marginRight: 16
                            }}
                        />
                        <div style={{
                            padding: '34px 0',
                            marginTop: '8px'
                        }}>
                            <Title level={3} style={{
                                margin: 0,
                                lineHeight: '1.2',
                                marginBottom: '4px'
                            }}>
                                Welcome, <span style={{ color: '#1890ff' }}>{user?.name}</span>
                            </Title>
                            <Text type="secondary" style={{
                                display: 'block',
                                lineHeight: '1.4'
                            }}>
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </Text>
                        </div>
                    </div>
                    <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                        {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                </Header>

                <Content style={{
                    margin: '88px 24px 24px 24px',
                    background: '#f5f5f5',
                    minHeight: 'calc(100vh - 112px)'
                }}>
                    {user?.role === "admin" && activeTab === "projects" && (
                        <Card style={{ marginBottom: 24 }}>
                            <Row justify="space-between" align="middle">
                                <Col>
                                    <Title level={4} style={{ margin: 0 }}>Admin Panel</Title>
                                    <Text type="secondary">Manage projects and system settings</Text>
                                </Col>
                                <Col>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setShowCreateProjectModal(true)}
                                    >
                                        New Project
                                    </Button>
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {activeTab === "users" && (user?.role === "admin" || user?.role === "teamleader") ? (
                        <Card>
                            <div style={{ marginBottom: 24 }}>
                                <Row justify="space-between" align="top" style={{ marginBottom: 16 }}>
                                    <Col>
                                        <Title level={4} style={{ margin: 0 }}>
                                            {user?.role === 'admin' ? 'User Management' : 'Team Members'}
                                        </Title>
                                        <Text type="secondary">
                                            {user?.role === 'admin'
                                                ? 'Manage all system users and their permissions'
                                                : 'Create and manage team members for your projects'}
                                        </Text>
                                    </Col>
                                    <Col>
                                        <Space>
                                            <Button
                                                icon={<ReloadOutlined />}
                                                onClick={loadUsers}
                                            >
                                                Refresh
                                            </Button>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => setShowCreateUserModal(true)}
                                            >
                                                New User
                                            </Button>
                                        </Space>
                                    </Col>
                                </Row>

                                {user?.role === 'teamleader' && (
                                    <Alert
                                        message="Team Leader Access"
                                        description={
                                            <div>
                                                <p style={{ marginBottom: 8 }}>You are viewing users from your assigned projects:</p>
                                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                                    <li>Team members assigned to your projects</li>
                                                    <li>Other team leaders working on the same projects</li>
                                                    <li>System administrators</li>
                                                    <li>You can only edit/delete regular users</li>
                                                </ul>
                                            </div>
                                        }
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                )}

                                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Input
                                            placeholder="Search users..."
                                            prefix={<SearchOutlined />}
                                            value={filters.search}
                                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            allowClear
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Select
                                            placeholder="All Roles"
                                            style={{ width: '100%' }}
                                            value={filters.role || undefined}
                                            onChange={(value) => setFilters(prev => ({ ...prev, role: value || '' }))}
                                            allowClear
                                        >
                                            <Option value="user">User</Option>
                                            {user?.role === 'admin' && (
                                                <>
                                                    <Option value="admin">Admin</Option>
                                                    <Option value="teamleader">Team Leader</Option>
                                                </>
                                            )}
                                        </Select>
                                    </Col>

                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Select
                                            placeholder="All Designations"
                                            style={{ width: '100%' }}
                                            value={filters.designation || undefined}
                                            onChange={(value) => setFilters(prev => ({ ...prev, designation: value || '' }))}
                                            allowClear
                                        >
                                            <Option value="Employee">Employee</Option>
                                            <Option value="Senior Developer">Senior Developer</Option>
                                            <Option value="Junior Developer">Junior Developer</Option>
                                            <Option value="Project Manager">Project Manager</Option>
                                            <Option value="Team Lead">Team Lead</Option>
                                            <Option value="Business Analyst">Business Analyst</Option>
                                            <Option value="QA Engineer">QA Engineer</Option>
                                            <Option value="DevOps Engineer">DevOps Engineer</Option>
                                            <Option value="UI/UX Designer">UI/UX Designer</Option>
                                            <Option value="Data Analyst">Data Analyst</Option>
                                            <Option value="Product Owner">Product Owner</Option>
                                            <Option value="Scrum Master">Scrum Master</Option>
                                            <Option value="Technical Lead">Technical Lead</Option>
                                            <Option value="Architect">Architect</Option>
                                            <Option value="Intern">Intern</Option>
                                        </Select>
                                    </Col>

                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                                            <Checkbox
                                                checked={filters.isActive}
                                                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.checked }))}
                                            >
                                                Active Only
                                            </Checkbox>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Button
                                            icon={filters.sortDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                                            onClick={() => setFilters(prev => ({ ...prev, sortDescending: !prev.sortDescending }))}
                                            style={{ width: '100%' }}
                                        >
                                            Sort {filters.sortDescending ? 'Desc' : 'Asc'}
                                        </Button>
                                    </Col>
                                </Row>
                            </div>

                            <Table
                                columns={userColumns}
                                dataSource={users}
                                rowKey="id"
                                loading={loadingUsers}
                                scroll={{ x: 800 }}
                                pagination={{
                                    current: pagination.currentPage,
                                    pageSize: pagination.perPage,
                                    total: pagination.totalCount,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['5', '10', '20', '50'],
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
                                    onChange: (page, pageSize) => {
                                        console.log('Pagination change - Page:', page, 'PageSize:', pageSize);
                                        setPagination(prev => ({ ...prev, currentPage: page, perPage: pageSize || prev.perPage }));
                                    },

                                    onShowSizeChange: (current, size) => {
                                        console.log('Page size change - Current:', current, 'Size:', size);
                                        // When page size changes, reset to page 1
                                        setPagination(prev => ({
                                            ...prev,
                                            currentPage: 1,
                                            perPage: size
                                        }));
                                    }
                                }}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description={
                                                <div>
                                                    <Text>No users found</Text>
                                                    <br />
                                                    <Button
                                                        type="primary"
                                                        icon={<PlusOutlined />}
                                                        onClick={() => setShowCreateUserModal(true)}
                                                        style={{ marginTop: 16 }}
                                                    >
                                                        Create First User
                                                    </Button>
                                                </div>
                                            }
                                        />
                                    )
                                }}
                            />
                        </Card>
                    ) : (
                        <div>
                            <Card style={{ marginBottom: 24 }}>
                                <Row justify="space-between" align="top" style={{ marginBottom: 16 }}>
                                    <Col>
                                        <Title level={4} style={{ margin: 0 }}>Projects Overview</Title>
                                        <Text type="secondary">
                                            {projectPagination.totalCount} projects found
                                            {projectFilters.search && ` matching "${projectFilters.search}"`}
                                            {projectFilters.status && ` with status "${projectFilters.status}"`}
                                        </Text>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Input
                                            placeholder="Search projects..."
                                            prefix={<SearchOutlined />}
                                            value={projectFilters.search}
                                            onChange={(e) => setProjectFilters(prev => ({ ...prev, search: e.target.value }))}
                                            allowClear
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Select
                                            placeholder="All Projects"
                                            style={{ width: '100%' }}
                                            value={projectFilters.status || undefined}
                                            onChange={(value) => setProjectFilters(prev => ({ ...prev, status: value || '' }))}
                                            allowClear
                                        >
                                            <Option value="Pending">Pending</Option>
                                            <Option value="In Progress">In Progress</Option>
                                            <Option value="Completed">Completed</Option>
                                            {user?.role === "admin" && <Option value="active">Active Projects</Option>}
                                            {user?.role === "admin" && <Option value="isDeleted">Deleted</Option>}
                                        </Select>
                                    </Col>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Select
                                            placeholder="Sort by"
                                            style={{ width: '100%' }}
                                            value={projectFilters.sortBy}
                                            onChange={(value) => setProjectFilters(prev => ({ ...prev, sortBy: value }))}
                                        >
                                            <Option value="title">Name</Option>
                                            <Option value="startDate">Start Date</Option>
                                            <Option value="endDate">End Date</Option>
                                        </Select>
                                    </Col>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Button
                                            icon={projectFilters.sortDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                                            onClick={() => setProjectFilters(prev => ({ ...prev, sortDescending: !prev.sortDescending }))}
                                            style={{ width: '100%' }}
                                        >
                                            Sort {projectFilters.sortDescending ? 'Desc' : 'Asc'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>

                            <Spin spinning={loadingProjects}>
                                {projects.length === 0 ? (
                                    <Card>
                                        <Empty
                                            description={
                                                <div>
                                                    <Title level={4}>No projects found</Title>
                                                    <Paragraph type="secondary">
                                                        {projectFilters.search || projectFilters.status
                                                            ? "Try adjusting your search or filter criteria"
                                                            : "Get started by creating your first project"}
                                                    </Paragraph>
                                                </div>
                                            }
                                        />
                                    </Card>
                                ) : (
                                    <>
                                        <Row gutter={[16, 16]}>
                                            {projects.map((project) => (
                                                <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                                                    <Card
                                                        hoverable
                                                        onClick={() => navigate(`/projects/${project.id}`)}
                                                        style={{
                                                            opacity: project.isDelete ? 0.6 : 1,
                                                            border: project.isDelete ? '1px dashed #d9d9d9' : undefined,
                                                            height: '100%'
                                                        }}
                                                        actions={[
                                                            <Space key="date">
                                                                <CalendarOutlined />
                                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                    {new Date(project.endDate).toLocaleDateString('en-GB', {
                                                                        timeZone: 'UTC',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </Text>
                                                            </Space>
                                                        ]}
                                                    >
                                                        <Card.Meta
                                                            title={
                                                                <Row justify="space-between" align="middle">
                                                                    <Col flex="1">
                                                                        <Text strong ellipsis>{project.title}</Text>
                                                                    </Col>
                                                                    <Col>
                                                                        <Tag
                                                                            icon={getStatusIcon(project.isDelete ? 'Deleted' : project.projectStatus)}
                                                                            color={project.isDelete ? 'error' : getStatusColor(project.projectStatus)}
                                                                            style={{ marginLeft: 8 }}
                                                                        >
                                                                            {project.isDelete ? "Deleted" : project.projectStatus}
                                                                        </Tag>
                                                                    </Col>
                                                                </Row>
                                                            }
                                                            description={
                                                                <div>
                                                                    <Paragraph
                                                                        ellipsis={{ rows: 2 }}
                                                                        style={{ marginBottom: 8, minHeight: '40px' }}
                                                                    >
                                                                        {project.description}
                                                                    </Paragraph>
                                                                    <Tag color="blue">{project.category}</Tag>
                                                                </div>
                                                            }
                                                        />
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>

                                        {projectPagination.totalPages > 1 && (
                                            <Row justify="center" style={{ marginTop: 24 }}>
                                                <Col>
                                                    <Pagination
                                                        current={projectPagination.currentPage}
                                                        pageSize={projectPagination.perPage}
                                                        total={projectPagination.totalCount}
                                                        showSizeChanger
                                                        showQuickJumper
                                                        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} projects`}
                                                        onChange={(page, pageSize) => {
                                                            setProjectPagination(prev => ({
                                                                ...prev,
                                                                currentPage: page,
                                                                perPage: pageSize || 6
                                                            }));
                                                        }}
                                                    />
                                                </Col>
                                            </Row>
                                        )}
                                    </>
                                )}
                            </Spin>
                        </div>
                    )}
                </Content>
            </Layout>

            {/* Update User Modal */}
            <Modal
                title="Update User"
                open={!!editUser}
                onCancel={() => {
                    setEditUser(null);
                    form.resetFields();
                }}
                footer={null}
                destroyOnClose
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[
                            { required: true, message: 'Please input the name!' },
                            { min: 2, message: 'Name must be at least 2 characters long!' },
                            { max: 50, message: 'Name cannot exceed 50 characters!' }
                        ]}
                    >
                        <Input placeholder="Full name" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please input the email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="Email address" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role!' }]}
                    >
                        <Select
                            placeholder="Select role"
                            disabled={user?.role === 'teamleader'} // Team Leaders cannot change roles
                        >
                            <Option value="user">User</Option>
                            {user?.role === 'admin' && (
                                <>
                                    <Option value="admin">Admin</Option>
                                    <Option value="teamleader">Team Leader</Option>
                                </>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="designation"
                        label="Designation"
                        rules={[{ required: false, message: 'Please select a designation!' }]}
                    >
                        <Select
                            placeholder="Select designation"
                            allowClear
                        >
                            <Option value="Employee">Employee</Option>
                            <Option value="Senior Developer">Senior Developer</Option>
                            <Option value="Junior Developer">Junior Developer</Option>
                            <Option value="Project Manager">Project Manager</Option>
                            <Option value="Team Lead">Team Lead</Option>
                            <Option value="Business Analyst">Business Analyst</Option>
                            <Option value="QA Engineer">QA Engineer</Option>
                            <Option value="DevOps Engineer">DevOps Engineer</Option>
                            <Option value="UI/UX Designer">UI/UX Designer</Option>
                            <Option value="Data Analyst">Data Analyst</Option>
                            <Option value="Product Owner">Product Owner</Option>
                            <Option value="Scrum Master">Scrum Master</Option>
                            <Option value="Technical Lead">Technical Lead</Option>
                            <Option value="Architect">Architect</Option>
                            <Option value="Intern">Intern</Option>
                        </Select>
                    </Form.Item>

                    {user?.role === 'teamleader' && (
                        <Alert
                            message="Limited Edit Access"
                            description="As a Team Leader, you cannot change user roles. Contact an administrator if role changes are needed."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form.Item
                        name="isActive"
                        valuePropName="checked"
                    >
                        <Checkbox>Active account</Checkbox>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => {
                                setEditUser(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loadingUpdate}
                                disabled={loadingUpdate}
                            >
                                {loadingUpdate ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Create User Modal */}
            {showCreateUserModal && (
                <CreateUser
                    onClose={() => setShowCreateUserModal(false)}
                    onUserCreated={() => {
                        // Ensure we're on the users tab
                        setActiveTab("users");
                        // Call the refresh handler
                        handleUserCreated();
                    }}
                />
            )}

            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <CreateProjectForm
                    onCancel={() => setShowCreateProjectModal(false)}
                    onProjectCreated={() => {
                        loadProjects();
                        setShowCreateProjectModal(false);
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                        <span>Confirm Deletion</span>
                    </Space>
                }
                open={!!confirmDelete}
                onCancel={() => setConfirmDelete(null)}
                footer={[
                    <Button key="cancel" onClick={() => setConfirmDelete(null)}>
                        Cancel
                    </Button>,
                    <Button
                        key="delete"
                        type="primary"
                        danger
                        onClick={() => confirmDelete && handleDelete(confirmDelete)}
                    >
                        Delete User
                    </Button>
                ]}
                destroyOnClose
                width={400}
            >
                <div style={{ padding: '16px 0' }}>
                    <Text>Are you sure you want to delete this user? This action cannot be undone.</Text>
                </div>
            </Modal>

            {/* Logout Confirmation Modal */}
            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                        <span>Confirm Logout</span>
                    </Space>
                }
                open={confirmLogout}
                onCancel={() => setConfirmLogout(false)}
                footer={[
                    <Button key="cancel" onClick={() => setConfirmLogout(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="logout"
                        type="primary"
                        danger
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                ]}
                destroyOnClose
                width={400}
            >
                <div style={{ padding: '16px 0' }}>
                    <Text>Are you sure you want to log out?</Text>
                </div>
            </Modal>

        </Layout>
    );
};

export default Dashboard;