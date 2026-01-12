import React, { useState } from "react";
import { Modal, Button } from "antd";
import CreateProjectForm from "../components/createproject";

interface CreateProjectModalProps {
    visible: boolean;
    onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ visible, onClose }) => {
    return (
        <Modal
            title={null}
            open={visible}
            onCancel={onClose}
            footer={null}
            width="90%"  // Responsive width
            style={{
                maxWidth: '900px',  // Max width for large screens
                top: 20  // Some top spacing
            }}
            bodyStyle={{
                padding: 0,  // Remove default padding
                height: '80vh',  // Fixed height
                maxHeight: '600px'  // Max height for large screens
            }}
            centered
            destroyOnClose
        >
            <CreateProjectForm onCancel={onClose} />
        </Modal>
    );
};

// Example usage in parent component
const ProjectManagement = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <div>
            <Button
                type="primary"
                onClick={() => setShowCreateModal(true)}
            >
                Create Project
            </Button>

            <CreateProjectModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
};

export default ProjectManagement;