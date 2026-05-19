import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfileData, user } = useAuth();
  
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first for immediate render
    const savedTheme = localStorage.getItem('stripeit-theme') as Theme | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return 'dark';
  });

  // sync with profile on mount/change
  useEffect(() => {
    if (profile?.themePreference && profile.themePreference !== theme) {
      setThemeState(profile.themePreference as Theme);
      localStorage.setItem('stripeit-theme', profile.themePreference);
    }
  }, [profile?.themePreference]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('stripeit-theme', newTheme);
    
    // Write to Firestore if authenticated
    if (user) {
      // Use updateProfileData from AuthContext
      updateProfileData({ themePreference: newTheme });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Apply data-theme attribute to document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
