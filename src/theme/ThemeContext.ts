import { createContext, useContext } from 'react';
import type { HealthCondition } from '../types';
import type { ChakraThemeConfig } from './chakraThemes';
import type { AnimationIntensity } from './motion';

export interface ThemeContextType {
  theme: ChakraThemeConfig;
  activeCondition: HealthCondition | null;
  setActiveCondition: (cond: HealthCondition | null) => void;
  previewCondition: HealthCondition | null;
  setPreviewCondition: (cond: HealthCondition | null) => void;
  animationIntensity: AnimationIntensity;
  setAnimationIntensity: (intensity: AnimationIntensity) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

export const useOptionalTheme = (): ThemeContextType | null => {
  return useContext(ThemeContext);
};
