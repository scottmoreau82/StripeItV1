import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { COLLECTIONS } from '@/src/constants';
import { useAuth } from './AuthContext';
import { SubscriptionTier, CustomThemeConfig } from '../types';

type Theme = 'dark' | 'light' | 'lightTeal' | 'lightBlue' | 'prog' | 'propink' | 'prowarm' | 'custom';

export const isProTheme = (theme: Theme): boolean => ['prog', 'propink', 'lightTeal', 'lightBlue', 'prowarm', 'custom'].includes(theme);

export const applyCustomTheme = (config: CustomThemeConfig) => {
  const root = document.documentElement;
  root.style.setProperty('--color-bg-deep', config.bgDeep);
  root.style.setProperty('--color-bg-surface', config.bgSurface);
  root.style.setProperty('--color-bg-card', config.bgCard);
  root.style.setProperty('--color-bg-elevated', config.bgElevated);
  root.style.setProperty('--color-brand-primary', config.brandPrimary);
  root.style.setProperty('--color-brand-secondary', config.brandSecondary);
  root.style.setProperty('--color-text-primary', config.textPrimary);
  root.style.setProperty('--color-text-secondary', config.textSecondary);
  root.style.setProperty('--color-text-muted', config.textMuted);
  root.style.setProperty('--color-border', config.borderColor);
  root.style.setProperty('--accent-primary', config.brandPrimary);
  root.style.setProperty('--accent-secondary', config.brandSecondary);
  root.style.setProperty('--shadow-glow', `0 0 25px -5px ${config.brandPrimary}55`);
};

export const clearCustomTheme = () => {
  const root = document.documentElement;
  const props = [
    '--color-bg-deep', '--color-bg-surface', '--color-bg-card', '--color-bg-elevated',
    '--color-brand-primary', '--color-brand-secondary', '--color-text-primary',
    '--color-text-secondary', '--color-text-muted', '--color-border',
    '--accent-primary', '--accent-secondary', '--shadow-glow'
  ];
  props.forEach(p => root.style.removeProperty(p));
};

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
    const validThemes: Theme[] = ['dark', 'light', 'lightTeal', 'lightBlue', 'prog', 'propink', 'prowarm', 'custom'];
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
    if (newTheme !== 'custom') {
      clearCustomTheme();
    }
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
