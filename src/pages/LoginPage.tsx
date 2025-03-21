import React from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const { authState } = useAuth();

  if (authState.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
