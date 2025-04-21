import React from 'react';
import { Session } from '../../types';
import { motion } from 'framer-motion';
import { FaCalendar, FaClock, FaCheckCircle, FaHistory } from 'react-icons/fa';

interface SessionHistoryProps {
  sessions: Session[];
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
        <FaHistory className="mr-2 text-indigo-600 dark:text-indigo-400" />
        Session History
      </h2>
      
      {sessions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg p-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-full mb-4">
            <FaCalendar className="text-gray-400 dark:text-gray-400 h-6 w-6" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">No past sessions found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Your completed sessions will appear here
          </p>
        </motion.div>
      ) : (
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {sessions.map((session, index) => (
            <motion.li 
              key={session.id}
              variants={itemVariants} 
              className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 p-4 transition-all hover:shadow-md"
              whileHover={{ y: -2 }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {session.title || "Mentoring Session"}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                      <FaCalendar className="mr-2 text-indigo-500 dark:text-indigo-400" />
                      {formatDate(session.date)}
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                      <FaClock className="mr-2 text-indigo-500 dark:text-indigo-400" />
                      {session.startTime} - {session.endTime}
                    </div>
                  </div>
                </div>
                <div className="mt-3 md:mt-0">
                  <span 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                        : session.status === 'cancelled'
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {session.status === 'completed' && <FaCheckCircle className="mr-1" />}
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
};

export default SessionHistory;
