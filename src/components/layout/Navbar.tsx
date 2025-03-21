import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">MentorMatch</Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/mentors" className="hover:text-indigo-200">Find Mentors</Link>
            
            {authState.isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-indigo-200">Dashboard</Link>
                <div className="flex items-center">
                  {authState.user?.profilePicture ? (
                    <img 
                      src={authState.user.profilePicture} 
                      alt={authState.user.name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center mr-2">
                      {authState.user?.name.charAt(0)}
                    </div>
                  )}
                  <span className="mr-4">{authState.user?.name}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <Link 
                  to="/login" 
                  className="hover:text-indigo-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
