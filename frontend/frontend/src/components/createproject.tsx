// Updated CreateProjectForm component with Modal wrapper
import React, { useState, useEffect, useContext } from "react";
import {
    Form,
    Input,
    Select,
    DatePicker,
    Checkbox,
    Button,
    Typography,
    Row,
    Col,
    message,
    Divider,
    Card,
    Tag,
    Modal
} from "antd";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import { fetchUsers, createProject } from "../services/api";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive?: boolean;
}

interface UsersResponse {
    users: User[];
}

interface AuthContextType {
    user: {
        token: string;
        role: string;
        designation: string;
    } | null;
}

interface FormData {
    title: string;
    description: string;
    category: string;
    teamLeaders: string[];
    assignedUsers: string[];
    startDate: string;
    endDate: string;
}

interface CreateProjectFormProps {
    onCancel: () => void;
    onProjectCreated: () => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onCancel, onProjectCreated }) => {
    const { user } = useContext(AuthContext) as AuthContextType;
    const token = user?.token;

    const [users, setUsers] = useState<User[]>([]);
    const [teamLeaders, setTeamLeaders] = useState<User[]>([]);
    const [regularUsers, setRegularUsers] = useState<User[]>([]);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getUsers = async () => {
            if (!token) return;
            try {
                const response: UsersResponse = await fetchUsers(token);
                const activeUsers = response.users.filter((u) => u.isActive);

                // Separate team leaders and regular users
                const leaders = activeUsers.filter(u => u.role === 'teamleader' || u.role === 'admin');
                const regular = activeUsers.filter(u => u.role === 'user');

                setUsers(activeUsers);
                setTeamLeaders(leaders);
                setRegularUsers(regular);
            } catch (error) {
                message.error("Failed to fetch users");
            }
        };
        getUsers();
    }, [token]);

    const handleSubmit = async (values: any) => {
        if (!token) return;

        setLoading(true);
        const payload: FormData = {
            ...values,
            teamLeaders: values.teamLeaders || [],
            assignedUsers: values.assignedUsers || [],
            startDate: values.startDate.format("YYYY-MM-DD"),
            endDate: values.endDate.format("YYYY-MM-DD"),
        };

        try {
            await createProject(payload, token);
            message.success("Project created successfully");
            form.resetFields();
            onProjectCreated(); // Call this instead of onCancel
        } catch (error) {
            console.error(error);
            message.error("Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div>
                    <Title level={3} style={{ margin: 0 }}>Create New Project</Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Assign team leaders who will manage this project and its tasks
                    </Text>
                </div>
            }
            open={true}
            onCancel={onCancel}
            footer={null}
            width={900}
            style={{ top: 20 }}
            /*bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}*/
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    title: "",
                    description: "",
                    category: "",
                    teamLeaders: [],
                    assignedUsers: [],
                    startDate: dayjs(),
                    endDate: dayjs().add(1, 'month'),
                }}
                style={{ marginTop: 24 }}
            >
                <Form.Item
                    label="Project Title"
                    name="title"
                    rules={[{ required: true, message: "Please enter the project title" }]}
                >
                    <Input placeholder="Enter project title" />
                </Form.Item>

                <Form.Item
                    label="Project Description"
                    name="description"
                    rules={[{ required: true, message: "Please enter the description" }]}
                >
                    <TextArea placeholder="Describe the project details" rows={4} />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
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

                    <Col xs={24} sm={6}>
                        <Form.Item
                            label="Start Date"
                            name="startDate"
                            rules={[{ required: true, message: "Please choose a start date" }]}
                        >
                            <DatePicker
                                style={{ width: "100%", cursor: 'pointer' }}
                                disabledDate={(d) => d.isBefore(dayjs(), "day")}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={6}>
                        <Form.Item
                            label="End Date"
                            name="endDate"
                            rules={[{ required: true, message: "Please choose a deadline" }]}
                        >
                            <DatePicker
                                style={{ width: "100%", cursor: 'pointer' }}
                                disabledDate={(d) => d.isBefore(dayjs(), "day")}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />

                {/* Team Leaders Section */}
                <Card style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
                    <Form.Item
                        label={
                            <span>
                                <strong>Assign Team Leaders</strong>
                                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                    (Team leaders can manage tasks and assign users)
                                </Text>
                            </span>
                        }
                        name="teamLeaders"
                    >
                        <Checkbox.Group style={{ width: "100%" }}>
                            <Row gutter={[12, 12]}>
                                {teamLeaders.length > 0 ? (
                                    teamLeaders.map((leader) => (
                                        <Col xs={24} sm={12} md={8} key={leader.id}>
                                            <Checkbox value={leader.id}>
                                                <span>{leader.name}</span>
                                                <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>
                                                    {leader.role === 'admin' ? 'Admin' : 'Team Leader'}
                                                </Tag>
                                            </Checkbox>
                                        </Col>
                                    ))
                                ) : (
                                    <Col span={24}>
                                        <Text type="secondary">No team leaders available</Text>
                                    </Col>
                                )}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Card>

                {/* Regular Users Section */}
                <Card style={{ backgroundColor: '#f6ffed' }}>
                    <Form.Item
                        label={
                            <span>
                                <strong>Assign Team Members</strong>
                                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                    (Optional - Team leaders can also assign users later)
                                </Text>
                            </span>
                        }
                        name="assignedUsers"
                    >
                        <Checkbox.Group style={{ width: "100%" }}>
                            <Row gutter={[12, 12]}>
                                {regularUsers.length > 0 ? (
                                    regularUsers.map((u) => (
                                        <Col xs={24} sm={12} md={8} key={u.id}>
                                            <Checkbox value={u.id}>
                                                {u.name}
                                            </Checkbox>
                                        </Col>
                                    ))
                                ) : (
                                    <Col span={24}>
                                        <Text type="secondary">No team members available</Text>
                                    </Col>
                                )}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Card>

                <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Create Project
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateProjectForm;

