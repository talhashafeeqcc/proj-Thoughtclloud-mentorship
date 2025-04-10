import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Footer: React.FC = () => {
  const { mode } = useTheme();

  return (
    <footer className="bg-purple-900 dark:bg-gray-900 border-t-4 border-purple-600 text-white py-8 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="animate-pulse-slow mr-2">✨</span>
              MentorMatch
            </h3>
            <p className="text-gray-300 dark:text-gray-400">
              Connecting mentors and mentees for professional growth and development.
            </p>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-purple-200 hover:text-white relative group">
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/mentors" className="text-purple-200 hover:text-white relative group">
                  Find Mentors
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-purple-200 hover:text-white relative group">
                  Become a Mentor
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h4 className="text-lg font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-purple-200 hover:text-white relative group">
                  Blog
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-purple-200 hover:text-white relative group">
                  FAQ
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-purple-200 hover:text-white relative group">
                  Support
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h4 className="text-lg font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-purple-200 hover:text-white relative group">
                  Terms of Service
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-purple-200 hover:text-white relative group">
                  Privacy Policy
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} MentorMatch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
