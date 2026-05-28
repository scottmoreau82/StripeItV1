import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { COLLECTIONS } from '@/src/constants';
import { useAuth } from './AuthContext';
import { SubscriptionTier } from '../types';

type Theme = 'dark' | 'light' | 'lightTeal' | 'lightBlue' | 'prog' | 'propink';

export const isProTheme = (theme: Theme): boolean => ['prog', 'propink', 'lightTeal', 'lightBlue'].includes(theme);

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
    const validThemes: Theme[] = ['dark', 'light', 'lightTeal', 'lightBlue', 'prog', 'propink'];
    if (savedTheme && validThemes.includes(savedTheme)) {
      return savedTheme;
    }
    return 'dark';
  });

  // sync with profile on mount/change
  useEffect(() => {
    if (profile?.themePreference && (profile.themePreference as Theme) !== theme) {
      setThemeState(profile.themePreference as Theme);
      localStorage.setItem('stripeit-theme', profile.themePreference);
    }

    if (profile?.themePreference && isProTheme(profile.themePreference as Theme) && profile.subscriptionTier !== SubscriptionTier.PRO && profile.subscriptionTier !== SubscriptionTier.ORGANIZATION) {
      setThemeState('dark');
      localStorage.setItem('stripeit-theme', 'dark');
    }
  }, [profile?.themePreference, profile?.subscriptionTier]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('stripeit-theme', newTheme);
    
    // Write to Firestore if authenticated
    if (user) {
      try {
        const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
        updateDoc(userDocRef, {
          themePreference: newTheme,
          updatedAt: serverTimestamp()
        }).catch((err) => {
          console.error("Failed to silently update theme in Firestore:", err);
        });
      } catch (err) {
        console.error("Error setting up theme silent update in Firestore:", err);
      }
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
