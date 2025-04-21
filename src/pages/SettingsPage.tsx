import React from "react";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import { clearDatabase } from "../services/database/db";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCog } from "react-icons/fa";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleResetDatabase = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the database? This will clear all data and you'll need to restart the application."
      )
    ) {
      await clearDatabase();
      alert("Database has been reset. Please refresh the application.");
      navigate("/");
      window.location.reload();
    }
  };

  // Check if we're in development environment
  const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-8 px-4"
    >
      <div className="container mx-auto max-w-4xl">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-6"
        >
          <FaCog className="text-2xl text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ProfileSettings />
        </motion.div>

        {/* Development only - reset database button */}
        {isDevelopment && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg shadow-sm"
          >
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
              Developer Tools
            </h2>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
              These tools are only available in development mode.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResetDatabase}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
            >
              Reset Database
            </motion.button>
            <p className="text-xs text-gray-700 dark:text-gray-400 mt-3">
              This will completely clear the database and reset all data. Use with
              caution.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SettingsPage;
