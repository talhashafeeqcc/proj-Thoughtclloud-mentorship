import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeSwitcher: React.FC = () => {
    const { mode, toggleMode } = useTheme();

    return (
        <button
            onClick={toggleMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative group"
            aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="overflow-hidden h-6 w-6 relative">
                {/* Sun icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 absolute transition-transform duration-500 ease-in-out ${mode === 'dark' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>

                {/* Moon icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 absolute transition-transform duration-500 ease-in-out ${mode === 'light' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </div>

            {/* Tooltip */}
            <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            </span>
        </button>
    );
};

export default ThemeSwitcher; 