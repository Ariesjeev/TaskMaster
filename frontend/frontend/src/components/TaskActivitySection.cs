// import React, { useState, useEffect, useContext } from "react";
// import {
//     Card,
//     Avatar,
//     Space,
//     Typography,
//     Empty,
//     Spin,
//     Tag
// } from "antd";
// import {
//     HistoryOutlined,
//     EditOutlined,
//     UserAddOutlined,
//     MessageOutlined,
//     UserDeleteOutlined,
//     PlusCircleOutlined
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import AuthContext from "../context/AuthContext";
// import { fetchTaskActivities } from "../services/api";

// dayjs.extend(relativeTime);

// const { Text, Title } = Typography;

// interface TaskActivity {
//     id: string;
//     activityType: string;
//     description: string;
//     userId: string;
//     userName: string;
//     createdAt: string;
//     metadata?: Record<string, any>;
// }

// interface AuthContextType {
//     user: {
//         token: string;
//         role: string;
//         name: string;
//     } | null;
// }

// interface TaskActivitySectionProps {
//     taskId: string;
//     taskTitle?: string;
// }

// const TaskActivitySection: React.FC<TaskActivitySectionProps> = ({ taskId, taskTitle }) => {
//     const { user } = useContext(AuthContext) as AuthContextType;
//     const token = user?.token;

//     const [activities, setActivities] = useState<TaskActivity[]>([]);
//     const [loading, setLoading] = useState<boolean>(false);

//     // Load activities when component mounts or taskId changes
//     useEffect(() => {
//         if (taskId && token) {
//             loadActivities();
//         }
//     }, [taskId, token]);

//     const loadActivities = async (): Promise<void> => {
//         if (!token || !taskId) return;

//         try {
//             setLoading(true);
//             const response = await fetchTaskActivities(taskId, token);
//             setActivities(response);
//         } catch (error) {
//             console.error("Error loading activities:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const getActivityIcon = (activityType: string) => {
//         switch (activityType) {
//             case 'task_created':
//                 return <PlusCircleOutlined style={{ color: '#52c41a' }} />;
//             case 'task_updated':
//                 return <EditOutlined style={{ color: '#1890ff' }} />;
//             case 'task_assigned':
//                 return <UserAddOutlined style={{ color: '#722ed1' }} />;
//             case 'task_unassigned':
//                 return <UserDeleteOutlined style={{ color: '#ff4d4f' }} />;
//             case 'comment_added':
//                 return <MessageOutlined style={{ color: '#fa8c16' }} />;
//             default:
//                 return <HistoryOutlined style={{ color: '#8c8c8c' }} />;
//         }
//     };

//     const getActivityColor = (activityType: string): string => {
//         switch (activityType) {
//             case 'task_created':
//                 return '#f6ffed';
//             case 'task_updated':
//                 return '#e6f7ff';
//             case 'task_assigned':
//                 return '#f9f0ff';
//             case 'task_unassigned':
//                 return '#fff2f0';
//             case 'comment_added':
//                 return '#fff7e6';
//             default:
//                 return '#fafafa';
//         }
//     };

//     const getInitials = (name: string): string => {
//         return name
//             .split(" ")
//             .map(word => word.charAt(0).toUpperCase())
//             .slice(0, 2)
//             .join("");
//     };

//     const formatDate = (dateString: string): string => {
//         const date = dayjs(dateString);
//         const now = dayjs();

//         if (now.diff(date, 'day') < 7) {
//             return date.fromNow();
//         } else {
//             return date.format('MMM DD, YYYY HH:mm');
//         }
//     };

//     const renderActivityMetadata = (activity: TaskActivity) => {
//         if (!activity.metadata) return null;

//         const { metadata } = activity;

//         // For field changes
//         if (metadata.field && metadata.oldValue !== undefined && metadata.newValue !== undefined) {
//             return (
//                 <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         Changed: <Text code>{metadata.field}</Text>
//                     </Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         From: <Text delete>{String(metadata.oldValue)}</Text> → <Text strong>{String(metadata.newValue)}</Text>
//                     </Text>
//                 </div>
//             );
//         }

//         // For user assignments
//         if (metadata.addedUsers) {
//             return (
//                 <div style={{ marginTop: 8 }}>
//                     <Space wrap>
//                         {metadata.addedUsers.map((user: string, index: number) => (
//                             <Tag key={`added-${index}`} color="green" size="small">
//                                 +{user}
//                             </Tag>
//                         ))}
//                     </Space>
//                 </div>
//             );
//         }

//         if (metadata.removedUsers) {
//             return (
//                 <div style={{ marginTop: 8 }}>
//                     <Space wrap>
//                         {metadata.removedUsers.map((user: string, index: number) => (
//                             <Tag key={`removed-${index}`} color="red" size="small">
//                                 -{user}
//                             </Tag>
//                         ))}
//                     </Space>
//                 </div>
//             );
//         }

//         return null;
//     };

//     return (
//         <Card
//             title={
//                 <Space>
//                     <HistoryOutlined />
//                     <Title level={4} style={{ margin: 0 }}>
//                         Activity ({activities.length})
//                     </Title>
//                 </Space>
//             }
//             style={{ marginTop: 24 }}
//         >
//             <Spin spinning={loading}>
//                 {activities.length === 0 ? (
//                     <Empty
//                         image={<HistoryOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
//                         description={
//                             <div>
//                                 <Text type="secondary">No activity yet</Text>
//                                 <br />
//                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                     Task activities will appear here
//                                 </Text>
//                             </div>
//                         }
//                     />
//                 ) : (
//                     <div style={{ marginTop: 16 }}>
//                         {activities.map((activity, index) => (
//                             <div key={activity.id} style={{ marginBottom: 16, position: 'relative' }}>
//                                 {/* Timeline line */}
//                                 {index !== activities.length - 1 && (
//                                     <div
//                                         style={{
//                                             position: 'absolute',
//                                             left: '18px',
//                                             top: '36px',
//                                             width: '2px',
//                                             height: 'calc(100% + 0px)',
//                                             backgroundColor: '#e8e8e8',
//                                             zIndex: 1
//                                         }}
//                                     />
//                                 )}

//                                 <div
//                                     style={{
//                                         display: 'flex',
//                                         alignItems: 'flex-start',
//                                         gap: '12px',
//                                         padding: '12px',
//                                         background: getActivityColor(activity.activityType),
//                                         borderRadius: '8px',
//                                         border: '1px solid #f0f0f0',
//                                         position: 'relative',
//                                         zIndex: 2
//                                     }}
//                                 >
//                                     {/* Activity Icon */}
//                                     <div
//                                         style={{
//                                             width: '36px',
//                                             height: '36px',
//                                             borderRadius: '50%',
//                                             backgroundColor: '#fff',
//                                             border: '2px solid #e8e8e8',
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             justifyContent: 'center',
//                                             flexShrink: 0
//                                         }}
//                                     >
//                                         {getActivityIcon(activity.activityType)}
//                                     </div>

//                                     {/* Activity Content */}
//                                     <div style={{ flex: 1, minWidth: 0 }}>
//                                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
//                                             <Avatar
//                                                 size="small"
//                                                 style={{
//                                                     backgroundColor: '#1890ff',
//                                                     fontSize: '12px',
//                                                     fontWeight: 'bold'
//                                                 }}
//                                             >
//                                                 {getInitials(activity.userName)}
//                                             </Avatar>
//                                             <Text strong style={{ fontSize: '13px' }}>
//                                                 {activity.userName}
//                                             </Text>
//                                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                 {formatDate(activity.createdAt)}
//                                             </Text>
//                                         </div>

//                                         <div style={{ marginBottom: '8px' }}>
//                                             <Text style={{ fontSize: '14px', lineHeight: '1.4' }}>
//                                                 {activity.description}
//                                             </Text>
//                                         </div>

//                                         {renderActivityMetadata(activity)}
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </Spin>
//         </Card>
//     );
// };

// export default TaskActivitySection;