import React from 'react';
import MentorList from '../components/mentor/MentorList';
import { motion } from 'framer-motion';
import { FaUserTie } from 'react-icons/fa';

const MentorListPage: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    >
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <FaUserTie className="text-2xl text-indigo-200" />
            <h1 className="text-3xl md:text-4xl font-bold text-center text-white">Find Your Mentor</h1>
          </div>
          <p className="text-center text-indigo-100 max-w-2xl mx-auto">
            Browse our community of professional mentors to find the perfect match for your career goals.
          </p>
        </motion.div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <MentorList />
      </div>
    </motion.div>
  );
};

export default MentorListPage;
