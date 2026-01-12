// components/createuser.tsx - Fixed with autocomplete and better error handling
import React, { useState, useContext } from "react";
import { registerUser } from "../services/api";
import { Modal, Form, Input, Button, Select, message, Alert } from "antd";
import AuthContext from "../context/AuthContext";

const { Option } = Select;

interface CreateUserProps {
    onClose: () => void;
    onUserCreated: () => void;
}

interface UserData {
    name: string;
    email: string;
    password: string;
    role?: string;
    designation?: string;
}

const CreateUser: React.FC<CreateUserProps> = ({ onClose, onUserCreated }) => {
    const { user } = useContext(AuthContext) as any;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (values: UserData) => {
        if (!user?.token) {
            message.error("Authentication token missing. Please login again.");
            return;
        }

        setLoading(true);
        try {
            // Set role based on user's permissions
            const userData = {
                ...values,
                role: user.role === 'teamleader' ? 'user' : (values.role || 'user')
            };

            console.log("Creating user with role:", userData.role);

            const response = await registerUser(userData, user.token);

            // Check various response formats
            if (response && (response.Id || response.id || response.name || response.email)) {
                message.success("User created successfully!");
                form.resetFields();

                // Wait a moment for the message to show
                setTimeout(() => {
                    onUserCreated();
                    onClose();
                }, 500);
            } else {
                throw new Error("User creation failed - invalid response");
            }
        } catch (error: any) {
            console.error("User creation error:", error);

            // Handle specific error messages
            if (error?.message?.includes("already exists")) {
                message.error("A user with this email already exists");
            } else if (error?.response?.status === 403) {
                message.error("You don't have permission to create users with this role");
            } else {
                const errorMessage = error?.message || error?.response?.data?.message || "Failed to create user";
                message.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Create New User"
            open={true}
            footer={null}
            onCancel={onClose}
            width={500}
            destroyOnClose
        >
            {user?.role === 'teamleader' && (
                <Alert
                    message="Team Leader Access"
                    description="As a Team Leader, you can create regular users for your projects."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
            >
                <Form.Item
                    label="Full Name"
                    name="name"
                    rules={[
                        { required: true, message: "Please input full name!" },
                        { min: 2, message: "Name must be at least 2 characters!" },
                        { max: 50, message: "Name cannot exceed 50 characters!" },
                        { pattern: /^[a-zA-Z\s]+$/, message: "Name should only contain letters and spaces!" }
                    ]}
                >
                    <Input
                        placeholder="Enter user's full name"
                        autoComplete="name"
                    />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: "Please input email!" },
                        { type: "email", message: "Invalid email format!" },
                        { max: 100, message: "Email cannot exceed 100 characters!" }
                    ]}
                >
                    <Input
                        placeholder="Enter user's email address"
                        autoComplete="email"
                        type="email"
                    />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        { required: true, message: "Please input password!" },
                        { min: 6, message: "Password must be at least 6 characters!" },
                        { max: 50, message: "Password cannot exceed 50 characters!" },
                        {
                            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                            message: "Password must contain at least one uppercase letter, one lowercase letter, and one number!"
                        }
                    ]}
                >
                    <Input.Password
                        placeholder="Enter password (min 6 characters)"
                        autoComplete="new-password"
                    />
                </Form.Item>

                {/* Only show role selection for admins */}
                {user?.role === 'admin' ? (
                    <Form.Item
                        label="Role"
                        name="role"
                        rules={[{ required: true, message: "Please select a role!" }]}
                        initialValue="user"
                    >
                        <Select placeholder="Select user role">
                            <Option value="user">User</Option>
                            <Option value="teamleader">Team Leader</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                    </Form.Item>
                ) : (
                    // For Team Leaders, show role as read-only
                    <Form.Item label="Role">
                        <Input value="User" disabled />
                        <Form.Item name="role" initialValue="user" hidden>
                            <Input />
                        </Form.Item>
                    </Form.Item>
                )}

                <Form.Item
                    label="Designation"
                    name="designation"
                    rules={[{ required: false, message: "Please select a designation!" }]}
                    initialValue="Employee"
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
                        message="Note: After creating the user, assign them to your projects to grant access."
                        type="warning"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                )}

                <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                    <Button
                        style={{ marginRight: 8 }}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                    >
                        {loading ? "Creating..." : "Create User"}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateUser;