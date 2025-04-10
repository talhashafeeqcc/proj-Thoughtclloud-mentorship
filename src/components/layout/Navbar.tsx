import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ThemeSwitcher from "../theme/ThemeSwitcher";

const Navbar: React.FC = () => {
  const { authState, logout } = useAuth();
  const { mode, color } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Define theme-based classes
  const themeClasses = {
    purple: {
      nav: "bg-theme-purple-600 dark:bg-theme-purple-900",
      buttonPrimary: "bg-white text-theme-purple-600 hover:bg-theme-purple-50 dark:bg-theme-purple-200 dark:text-theme-purple-900",
      textHover: "hover:text-theme-purple-200 dark:hover:text-theme-purple-300",
    },
    blue: {
      nav: "bg-theme-blue-600 dark:bg-theme-blue-900",
      buttonPrimary: "bg-white text-theme-blue-600 hover:bg-theme-blue-50 dark:bg-theme-blue-200 dark:text-theme-blue-900",
      textHover: "hover:text-theme-blue-200 dark:hover:text-theme-blue-300",
    },
    yellow: {
      nav: "bg-theme-yellow-500 dark:bg-theme-yellow-700",
      buttonPrimary: "bg-white text-theme-yellow-600 hover:bg-theme-yellow-50 dark:bg-theme-yellow-200 dark:text-theme-yellow-900",
      textHover: "hover:text-theme-yellow-200 dark:hover:text-theme-yellow-300",
    },
  };

  const currentTheme = themeClasses[color];

  return (
    <nav className={`text-white shadow-md ${currentTheme.nav} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold animate-fade-in">
            MentorMatch
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center"
            aria-label="Toggle mobile menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/mentors" className={`${currentTheme.textHover} transition-colors`}>
              Find Mentors
            </Link>

            <ThemeSwitcher />

            {authState.isAuthenticated ? (
              <>
                <Link to="/dashboard" className={`${currentTheme.textHover} transition-colors`}>
                  Dashboard
                </Link>
                <div className="flex items-center relative" ref={dropdownRef}>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={toggleDropdown}
                    onKeyDown={(e) => e.key === "Enter" && toggleDropdown()}
                    tabIndex={0}
                    aria-label="User menu"
                  >
                    {authState.user?.profilePicture ? (
                      <img
                        src={authState.user.profilePicture}
                        alt={authState.user.name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-2">
                        {authState.user?.name.charAt(0)}
                      </div>
                    )}
                    <span className="mr-2">{authState.user?.name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 top-full w-48 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-md shadow-lg py-1 z-10">
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setDropdownOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className={`${currentTheme.textHover} transition-colors`}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`${currentTheme.buttonPrimary} px-4 py-2 rounded-md transition-colors`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-3 animate-slide-down">
            <Link
              to="/mentors"
              className={`block py-2 ${currentTheme.textHover}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Mentors
            </Link>

            {authState.isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`block py-2 ${currentTheme.textHover}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  className={`block py-2 ${currentTheme.textHover}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={`block py-2 ${currentTheme.textHover} w-full text-left`}
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  className={`block py-2 ${currentTheme.textHover}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`${currentTheme.buttonPrimary} px-4 py-2 rounded-md text-center`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}

            <div className="py-2">
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
