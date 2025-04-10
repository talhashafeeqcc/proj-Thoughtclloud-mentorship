import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Footer: React.FC = () => {
  const { color, mode } = useTheme();

  // Define theme-based classes
  const themeClasses = {
    purple: {
      footer: "bg-theme-purple-900 dark:bg-gray-900 border-t-4 border-theme-purple-600",
      link: "text-theme-purple-200 hover:text-white",
    },
    blue: {
      footer: "bg-theme-blue-900 dark:bg-gray-900 border-t-4 border-theme-blue-600",
      link: "text-theme-blue-200 hover:text-white",
    },
    yellow: {
      footer: "bg-theme-yellow-800 dark:bg-gray-900 border-t-4 border-theme-yellow-500",
      link: "text-theme-yellow-200 hover:text-white",
    },
  };

  const currentTheme = themeClasses[color];

  return (
    <footer className={`${currentTheme.footer} text-white py-8 transition-colors duration-300`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-4">MentorMatch</h3>
            <p className="text-gray-300 dark:text-gray-400">
              Connecting mentors and mentees for professional growth and development.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className={currentTheme.link}>Home</Link></li>
              <li><Link to="/mentors" className={currentTheme.link}>Find Mentors</Link></li>
              <li><Link to="/register" className={currentTheme.link}>Become a Mentor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/blog" className={currentTheme.link}>Blog</Link></li>
              <li><Link to="/faq" className={currentTheme.link}>FAQ</Link></li>
              <li><Link to="/support" className={currentTheme.link}>Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className={currentTheme.link}>Terms of Service</Link></li>
              <li><Link to="/privacy" className={currentTheme.link}>Privacy Policy</Link></li>
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
