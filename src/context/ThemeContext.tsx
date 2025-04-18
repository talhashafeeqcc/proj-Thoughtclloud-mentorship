import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleMode: () => void;
    setMode: (mode: ThemeMode) => void;
    isDark: boolean;
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
    // Initialize theme from localStorage, OS preference, or default to light
    const [mode, setThemeMode] = useState<ThemeMode>(() => {
        // First check localStorage
        const savedMode = localStorage.getItem('themeMode');
        if (savedMode === 'dark' || savedMode === 'light') {
            return savedMode as ThemeMode;
        }
        
        // Then check OS preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        // Default to light theme
        return 'light';
    });

    // Update localStorage and apply theme to document when mode changes
    useEffect(() => {
        localStorage.setItem('themeMode', mode);

        // Apply theme to document.documentElement
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', mode === 'dark' ? '#1e1e1e' : '#ffffff');
        }
    }, [mode]);

    // Listen for OS theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e: MediaQueryListEvent) => {
            // Only change theme automatically if user hasn't explicitly set a preference
            if (!localStorage.getItem('themeMode')) {
                setThemeMode(e.matches ? 'dark' : 'light');
            }
        };
        
        // Add listener for OS theme changes
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);

    const toggleMode = () => {
        setThemeMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
    };
    
    const setMode = (newMode: ThemeMode) => {
        setThemeMode(newMode);
    };

    return (
        <ThemeContext.Provider value={{ 
            mode, 
            toggleMode, 
            setMode,
            isDark: mode === 'dark'
        }}>
            {children}
        </ThemeContext.Provider>
    );
}; 