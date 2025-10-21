import { useAuth } from "@/lib/authContext";
import React from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
