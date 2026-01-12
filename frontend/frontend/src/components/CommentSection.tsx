

import React, { useState, useEffect, useContext } from "react";
import {
    Card,
    Button,
    Input,
    List,
    Avatar,
    Space,
    Typography,
    Popconfirm,
    message,
    Empty,
    Spin,
    Modal,
    Form
} from "antd";
import {
    SendOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    UserOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AuthContext from "../context/AuthContext";
import {
    fetchTaskComments,
    createComment,
    updateComment,
    deleteComment
} from "../services/api";

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text, Title } = Typography;

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

interface AuthContextType {
    user: {
        token: string;
        role: string;
        name: string;
        id: string; // Added id field
    } | null;
}

interface CommentSectionProps {
    taskId: string;
    taskTitle?: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ taskId, taskTitle }) => {
    const { user } = useContext(AuthContext) as AuthContextType;
    const token = user?.token;

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [newComment, setNewComment] = useState<string>("");
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>("");
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [form] = Form.useForm();

    // Load comments when component mounts or taskId changes
    useEffect(() => {
        if (taskId && token) {
            loadComments();
        }
    }, [taskId, token]);

    const loadComments = async (): Promise<void> => {
        if (!token || !taskId) return;

        try {
            setLoading(true);
            const response = await fetchTaskComments(taskId, token);
            // Sort comments by creation date (newest first)
            const sortedComments = response.sort((a: Comment, b: Comment) =>
                dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
            );
            setComments(sortedComments);
        } catch (error) {
            console.error("Error loading comments:", error);
            message.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (): Promise<void> => {
        if (!token || !newComment.trim()) return;

        try {
            setSubmitting(true);
            const comment = await createComment(taskId, { content: newComment.trim() }, token);

            // Ensure the new comment has proper user information
            const enhancedComment = {
                ...comment,
                createdByName: comment.createdByName || user?.name || 'Unknown User',
                createdBy: comment.createdBy || user?.id || '',
            };

            // Add new comment at the beginning (newest first)
            setComments(prev => [enhancedComment, ...prev]);
            setNewComment("");
            message.success("Comment added successfully");
        } catch (error) {
            console.error("Error creating comment:", error);
            message.error("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditComment = (comment: Comment): void => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
        form.setFieldsValue({ content: comment.content });
        setShowEditModal(true);
    };

    const handleUpdateComment = async (values: { content: string }): Promise<void> => {
        if (!token || !editingComment || !values.content.trim()) return;

        try {
            const updatedComment = await updateComment(
                taskId,
                editingComment,
                { content: values.content.trim() },
                token
            );

            // Ensure updated comment maintains proper user information
            const enhancedUpdatedComment = {
                ...updatedComment,
                createdByName: updatedComment.createdByName || user?.name || 'Unknown User',
            };

            setComments(prev =>
                prev.map(comment =>
                    comment.id === editingComment ? enhancedUpdatedComment : comment
                )
            );

            setShowEditModal(false);
            setEditingComment(null);
            form.resetFields();
            message.success("Comment updated successfully");
        } catch (error) {
            console.error("Error updating comment:", error);
            message.error("Failed to update comment");
        }
    };

    const handleDeleteComment = async (commentId: string): Promise<void> => {
        if (!token) return;

        try {
            await deleteComment(taskId, commentId, token);
            setComments(prev => prev.filter(comment => comment.id !== commentId));
            message.success("Comment deleted successfully");
        } catch (error) {
            console.error("Error deleting comment:", error);
            message.error("Failed to delete comment");
        }
    };

    const getInitials = (name: string): string => {
        if (!name || name.trim() === '') return 'U';
        return name
            .trim()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("");
    };

    const formatDate = (dateString: string): string => {
        const date = dayjs(dateString);
        const now = dayjs();

        if (now.diff(date, 'day') < 7) {
            return date.fromNow();
        } else {
            return date.format('MMM DD, YYYY');
        }
    };

    // Helper function to get display name
    const getDisplayName = (comment: Comment): string => {
        if (comment.createdByName && comment.createdByName.trim() !== '') {
            return comment.createdByName;
        }
        // Fallback to createdBy if createdByName is not available
        if (comment.createdBy && comment.createdBy.trim() !== '') {
            return comment.createdBy;
        }
        return 'Unknown User';
    };

    return (
        <Card
            title={
                <Space>
                    <MessageOutlined />
                    <Title level={4} style={{ margin: 0 }}>
                        Comments ({comments.length})
                    </Title>
                </Space>
            }
            style={{ marginTop: 24 }}
        >
            {/* Comment Input */}
            <div style={{ marginBottom: 24 }}>
                <Space.Compact style={{ width: '100%' }}>
                    <TextArea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                        style={{ resize: 'none' }}
                        maxLength={1000}
                        showCount
                    />
                </Space.Compact>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSubmitComment}
                        loading={submitting}
                        disabled={!newComment.trim()}
                    >
                        Add Comment
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            <Spin spinning={loading}>
                {comments.length === 0 ? (
                    <Empty
                        image={<MessageOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
                        description={
                            <div>
                                <Text type="secondary">No comments yet</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Be the first to share your thoughts
                                </Text>
                            </div>
                        }
                    />
                ) : (
                    <List
                        dataSource={comments}
                        renderItem={(comment) => {
                            const displayName = getDisplayName(comment);
                            return (
                                <List.Item
                                    key={comment.id}
                                    style={{
                                        padding: '16px 0',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                size="large"
                                                style={{
                                                    backgroundColor: '#1890ff',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                                icon={!displayName || displayName === 'Unknown User' ? <UserOutlined /> : undefined}
                                            >
                                                {displayName && displayName !== 'Unknown User' ? getInitials(displayName) : undefined}
                                            </Avatar>
                                        }
                                        title={
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text strong>{displayName}</Text>
                                                    <Text type="secondary" style={{ marginLeft: 12, fontSize: '12px' }}>
                                                        {formatDate(comment.createdAt)}
                                                        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                                            <span> • edited</span>
                                                        )}
                                                    </Text>
                                                </div>
                                                {(comment.canEdit || comment.canDelete) && (
                                                    <Space size="small">
                                                        {comment.canEdit && (
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<EditOutlined />}
                                                                onClick={() => handleEditComment(comment)}
                                                            />
                                                        )}
                                                        {comment.canDelete && (
                                                            <Popconfirm
                                                                title="Delete comment"
                                                                description="Are you sure you want to delete this comment?"
                                                                onConfirm={() => handleDeleteComment(comment.id)}
                                                                okText="Delete"
                                                                cancelText="Cancel"
                                                                okButtonProps={{ danger: true }}
                                                            >
                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<DeleteOutlined />}
                                                                    danger
                                                                />
                                                            </Popconfirm>
                                                        )}
                                                    </Space>
                                                )}
                                            </div>
                                        }
                                        description={
                                            <div style={{ marginTop: 8 }}>
                                                <Text style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                                    {comment.content}
                                                </Text>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Spin>

            {/* Edit Comment Modal */}
            <Modal
                title="Edit Comment"
                open={showEditModal}
                onCancel={() => {
                    setShowEditModal(false);
                    setEditingComment(null);
                    form.resetFields();
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    onFinish={handleUpdateComment}
                    layout="vertical"
                >
                    <Form.Item
                        name="content"
                        rules={[
                            { required: true, message: 'Please enter comment content' },
                            { min: 1, message: 'Comment cannot be empty' },
                            { max: 1000, message: 'Comment cannot exceed 1000 characters' }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Edit your comment..."
                            maxLength={1000}
                            showCount
                            style={{ resize: 'none' }}
                        />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingComment(null);
                                    form.resetFields();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Update Comment
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default CommentSection;