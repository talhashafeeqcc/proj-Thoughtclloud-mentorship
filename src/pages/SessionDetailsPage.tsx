import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SessionDetails from "../components/SessionDetails";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SessionDetailsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { authState } = useAuth();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (!sessionId) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-6 rounded-r-md shadow-sm"
      >
        <p className="font-bold">Error</p>
        <p>Session ID is missing from the URL.</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-8 px-4 md:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link
            to="/dashboard"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center font-medium transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </motion.div>

        <motion.h1 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white"
        >
          Session Details
        </motion.h1>

        {!authState.user ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r-md shadow-sm"
          >
            <p className="font-bold">Authentication Required</p>
            <p>Please log in to view session details.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <SessionDetails
              sessionId={sessionId}
              currentUserId={authState.user.id}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SessionDetailsPage;
