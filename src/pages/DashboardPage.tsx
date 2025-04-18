import React from "react";
import { useAuth } from "../context/AuthContext";
import MentorDashboard from "../components/dashboard/MentorDashboard";
import MenteeDashboard from "../components/dashboard/MenteeDashboard";
import { FaChartLine, FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";

const DashboardPage: React.FC = () => {
  const { authState } = useAuth();

  if (!authState.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center p-8 max-w-md">
          <FaSpinner className="animate-spin text-indigo-600 dark:text-indigo-400 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Loading your dashboard...</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Please wait while we prepare your experience</p>
        </div>
      </div>
    );
  }

  // Extract user's name or email for greeting
  const userName = authState.user.name || authState.user.email?.split('@')[0] || 'there';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    >
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white p-6 md:p-8 shadow-md">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 mb-2"
          >
            <FaChartLine className="text-2xl text-indigo-200" />
            <h1 className="text-2xl md:text-3xl font-bold">Your Dashboard</h1>
          </motion.div>
          <p className="opacity-90 text-indigo-100">
            Welcome back, {userName}!
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 border border-gray-100 dark:border-gray-700"
        >
          {authState.user.role === "mentor" ? (
            <MentorDashboard />
          ) : (
            <MenteeDashboard />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
