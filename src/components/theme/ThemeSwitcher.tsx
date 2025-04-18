import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SunMedium, Moon } from 'lucide-react';

const ThemeSwitcher: React.FC = () => {
    const { mode, toggleMode } = useTheme();
    const [showTooltip, setShowTooltip] = useState(false);
    const isDarkMode = mode === 'dark';
    
    const handleToggle = () => {
        toggleMode();
        // Momentarily show tooltip after toggling
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
    };

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggle}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors relative flex items-center justify-center"
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
                <div className="relative w-6 h-6">
                    <AnimatePresence mode="wait" initial={false}>
                        {isDarkMode ? (
                            <motion.div
                                key="sun"
                                initial={{ rotate: -30, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 30, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <SunMedium className="h-6 w-6 text-yellow-300" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="moon"
                                initial={{ rotate: 30, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -30, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Moon className="h-6 w-6 text-indigo-200" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>
            
            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-indigo-600 dark:bg-indigo-500 text-white text-xs px-2.5 py-1.5 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-lg"
                    >
                        {isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-600 dark:bg-indigo-500 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThemeSwitcher; 