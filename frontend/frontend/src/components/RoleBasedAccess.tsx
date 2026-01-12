// components/RoleBasedAccess.tsx
import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';

interface RoleBasedAccessProps {
    roles: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
    roles,
    children,
    fallback = null
}) => {
    const { user } = useContext(AuthContext) as any;

    if (roles.includes(user?.role)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default RoleBasedAccess;

// Usage example:
//<RoleBasedAccess roles={['admin', 'teamleader']}>
//    <Button onClick={handleCreateTask}>Create Task</Button>
//</RoleBasedAccess>