import React from 'react';
import { Navigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { authState } = useAuth();
  
  if (authState.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Create Your Account</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
