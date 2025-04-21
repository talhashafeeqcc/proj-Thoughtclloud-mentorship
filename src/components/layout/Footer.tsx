import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const { mode } = useTheme();
  const currentYear = new Date().getFullYear();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <footer className="bg-indigo-900 dark:bg-gray-900 border-t-4 border-indigo-600 dark:border-indigo-700 text-white py-12 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={item}>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="animate-pulse-slow mr-2">✨</span>
              MentorMatch
            </h3>
            <p className="text-indigo-100 dark:text-gray-300">
              Connecting mentors and mentees for professional growth and development.
            </p>
          </motion.div>

          <motion.div variants={item}>
            <h4 className="text-lg font-semibold mb-3 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/mentors" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  Find Mentors
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  Become a Mentor
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={item}>
            <h4 className="text-lg font-semibold mb-3 text-white">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  Blog
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  FAQ
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  Support
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={item}>
            <h4 className="text-lg font-semibold mb-3 text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  Terms of Service
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-indigo-200 hover:text-white dark:text-indigo-300 dark:hover:text-white relative group transition-colors">
                  Privacy Policy
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-300 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        <div className="border-t border-indigo-800 dark:border-gray-700 mt-10 pt-8 text-center text-indigo-200 dark:text-gray-300">
          <p className="flex items-center justify-center text-sm">
            &copy; {currentYear} MentorMatch. All rights reserved. Made with <Heart className="h-4 w-4 text-red-400 mx-1 fill-red-400" /> by Thoughtcloud
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
