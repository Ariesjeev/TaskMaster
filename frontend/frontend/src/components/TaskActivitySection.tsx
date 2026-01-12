import React, { useState, useEffect, useContext } from "react";
import {
    Card,
    Avatar,
    Space,
    Typography,
    Empty,
    Spin,
    Tag,
} from "antd";
import {
    HistoryOutlined,
    EditOutlined,
    UserAddOutlined,
    MessageOutlined,
    UserDeleteOutlined,
    PlusCircleOutlined,
    CheckCircleOutlined,
    SyncOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AuthContext from "../context/AuthContext";
import { fetchTaskActivities } from "../services/api";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

interface TaskActivity {
    id: string;
    activityType: string;
    description: string;
    userId: string;
    userName: string;
    createdAt: string;
    metadata?: Record<string, any>;
}

interface AuthContextType {
    user: {
        id?: string;
        token: string;
        role: string;
        name: string;
    } | null;
}

interface TaskActivitySectionProps {
    taskId: string;
    taskTitle?: string;
}

const TaskActivitySection: React.FC<TaskActivitySectionProps> = ({ taskId, taskTitle }) => {
    const { user } = useContext(AuthContext) as AuthContextType;
    const token = user?.token;
    const userId = user?.id;

    const [activities, setActivities] = useState<TaskActivity[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Load activities when component mounts or taskId changes
    useEffect(() => {
        if (taskId && token) {
            loadActivities();
        }
    }, [taskId, token]);
    const isLikelyId = (s?: string) => !!s && (/^[0-9a-fA-F]{24}$/.test(s) || /^[0-9a-fA-F\-]{36}$/.test(s));

    const loadActivities = async (): Promise<void> => {
        if (!token || !taskId) return;

        try {
            setLoading(true);
            const response = await fetchTaskActivities(taskId, token);
            // Sort activities by date (newest first)
            const sortedActivities = Array.isArray(response)
                ? response.sort((a: TaskActivity, b: TaskActivity) =>
                    dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
                     // Replace opaque userName (IDs) for the current signed-in user with the actual name
                    .map((act: TaskActivity) => {
                        const copy = { ...act };
                        if (userId && copy.userId === userId && isLikelyId(copy.userName)) {
                            copy.userName = user?.name ?? copy.userName;
                        }
                        return copy;
                    })
                : [];
            setActivities(sortedActivities);
        } catch (error) {
            console.error("Error loading activities:", error);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (activityType: string) => {
        switch (activityType) {
            case 'task_created':
            case 'TaskCreated':
                return <PlusCircleOutlined style={{ color: '#52c41a' }} />;
            case 'task_updated':
            case 'TaskUpdated':
            case 'StatusChanged':
                return <EditOutlined style={{ color: '#1890ff' }} />;
            case 'task_assigned':
            case 'UserAssigned':
                return <UserAddOutlined style={{ color: '#722ed1' }} />;
            case 'task_unassigned':
            case 'UserUnassigned':
                return <UserDeleteOutlined style={{ color: '#ff4d4f' }} />;
            case 'comment_added':
            case 'Comment':
                return <MessageOutlined style={{ color: '#fa8c16' }} />;
            case 'task_completed':
            case 'TaskCompleted':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'task_in_progress':
            case 'TaskInProgress':
                return <SyncOutlined style={{ color: '#1890ff' }} />;
            default:
                return <HistoryOutlined style={{ color: '#8c8c8c' }} />;
        }
    };

    const getActivityColor = (activityType: string): string => {
        switch (activityType) {
            case 'task_created':
            case 'TaskCreated':
                return 'green';
            case 'task_updated':
            case 'TaskUpdated':
            case 'StatusChanged':
                return 'blue';
            case 'task_assigned':
            case 'UserAssigned':
                return 'purple';
            case 'task_unassigned':
            case 'UserUnassigned':
                return 'red';
            case 'comment_added':
            case 'Comment':
                return 'orange';
            default:
                return 'gray';
        }
    };

    const getInitials = (name: string): string => {
        if (!name) return 'U';
        return name
            .split(" ")
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("");
    };

    const formatDate = (dateString: string): string => {
        const date = dayjs(dateString);
        const now = dayjs();

        if (now.diff(date, 'day') < 1) {
            return date.fromNow();
        } else if (now.diff(date, 'day') < 7) {
            return date.format('ddd [at] HH:mm');
        } else {
            return date.format('MMM DD, YYYY [at] HH:mm');
        }
    };

    const renderActivityDescription = (activity: TaskActivity) => {
        // Enhanced description rendering based on activity type
        const { activityType, description, metadata } = activity;

        if (activityType === 'StatusChanged' && metadata) {
            return (
                <div>
                    <Text>changed status from </Text>
                    <Tag color={getStatusColor(metadata.oldValue)}>{metadata.oldValue}</Tag>
                    <Text> to </Text>
                    <Tag color={getStatusColor(metadata.newValue)}>{metadata.newValue}</Tag>
                </div>
            );
        }

        if (activityType === 'Comment') {
            return (
                <div>
                    <Text>commented: </Text>
                    <Text type="secondary" italic>
                        "{description.length > 100 ? description.substring(0, 100) + '...' : description}"
                    </Text>
                </div>
            );
        }

        return <Text>{description}</Text>;
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'processing';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Card
            title={
                <Space>
                    <HistoryOutlined />
                    <Title level={4} style={{ margin: 0 }}>
                        Activity History ({activities.length})
                    </Title>
                </Space>
            }
            style={{ marginTop: 24 }}
        >
            <Spin spinning={loading}>
                {activities.length === 0 ? (
                    <Empty
                        image={<HistoryOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
                        description={
                            <div>
                                <Text type="secondary">No activity yet</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Task activities will appear here
                                </Text>
                            </div>
                        }
                    />
                ) : (
                        <div style={{ marginTop: 20 }}>
                            {activities.map((activity, index) => (
                                <div
                                    key={activity.id}
                                    style={{
                                        marginBottom: 16,
                                        paddingLeft: 40,
                                        position: 'relative',
                                        paddingBottom: index === activities.length - 1 ? 0 : 16,
                                        borderBottom: index === activities.length - 1 ? 'none' : '1px solid #f0f0f0'
                                    }}
                                >
                                    {/* Activity Icon positioned on the left */}
                                    {/*     <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: 32,
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#fff',
                                        border: '2px solid #f0f0f0',
                                        borderRadius: '50%'
                                    }}>
                                        {getActivityIcon(activity.activityType)}
                                    </div>*/}

                                    <div style={{ marginBottom: 16 }}>
                                        <Space align="center" style={{ marginBottom: 8 }}>
                                            <Avatar
                                                size="small"
                                                style={{
                                                    backgroundColor: '#1890ff',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                {getInitials(activity.userName)}
                                            </Avatar>
                                            <Text strong>{activity.userName}</Text>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {formatDate(activity.createdAt)}
                                            </Text>
                                        </Space>

                                        <div style={{ marginLeft: 32 }}>
                                            {renderActivityDescription(activity)}

                                            {/* Render metadata if available */}
                                            {activity.metadata && activity.metadata.changes && (
                                                <div style={{ marginTop: 8, padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                                                    {Object.entries(activity.metadata.changes).map(([field, value]: [string, any]) => (
                                                        <div key={field}>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                {field}: {value.old} → {value.new}
                                                            </Text>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                )}
            </Spin>
        </Card>
    );
};

export default TaskActivitySection;