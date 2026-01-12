import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

interface ProtectedRouteProps {
    component: React.ComponentType<any>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component }) => {
    const { user } = useContext(AuthContext);
    return user ? React.createElement(Component) : <Navigate to="/" replace />;

    return user ? <Component /> : <Navigate to="/"/>;
};




export default ProtectedRoute;
