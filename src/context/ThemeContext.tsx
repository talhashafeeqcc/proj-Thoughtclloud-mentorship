import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemeColor = 'purple' | 'blue' | 'yellow';

interface ThemeContextType {
    mode: ThemeMode;
    color: ThemeColor;
    toggleMode: () => void;
    setThemeColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize theme from localStorage or default to light
    const [mode, setMode] = useState<ThemeMode>(() => {
        const savedMode = localStorage.getItem('themeMode');
        return (savedMode as ThemeMode) || 'light';
    });

    // Initialize color theme from localStorage or default to purple
    const [color, setColor] = useState<ThemeColor>(() => {
        const savedColor = localStorage.getItem('themeColor');
        return (savedColor as ThemeColor) || 'purple';
    });

    // Update localStorage when theme changes
    useEffect(() => {
        localStorage.setItem('themeMode', mode);
        document.documentElement.classList.remove('light-mode', 'dark-mode');
        document.documentElement.classList.add(`${mode}-mode`);
    }, [mode]);

    // Update localStorage when color changes
    useEffect(() => {
        localStorage.setItem('themeColor', color);
        document.documentElement.classList.remove('theme-purple', 'theme-blue', 'theme-yellow');
        document.documentElement.classList.add(`theme-${color}`);
    }, [color]);

    const toggleMode = () => {
        setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
    };

    const setThemeColor = (newColor: ThemeColor) => {
        setColor(newColor);
    };

    return (
        <ThemeContext.Provider value={{ mode, color, toggleMode, setThemeColor }}>
            {children}
        </ThemeContext.Provider>
    );
}; 