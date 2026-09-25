import React, { useState, useEffect } from 'react';
import type { HealthCondition } from '../types';
import { CHAKRA_THEMES, DEFAULT_NEUTRAL_THEME } from './chakraThemes';
import type { AnimationIntensity } from './motion';
import { ThemeContext } from './ThemeContext';

const STORAGE_KEY_INTENSITY = 'music_mantra_anim_intensity';

export const ThemeProvider: React.FC<{
  initialCondition?: HealthCondition | null;
  activeCondition?: HealthCondition | null;
  children: React.ReactNode;
}> = ({ initialCondition = null, activeCondition: propActiveCondition, children }) => {
  const [internalActiveCondition, setInternalActiveCondition] = useState<HealthCondition | null>(initialCondition);
  const [previewCondition, setPreviewCondition] = useState<HealthCondition | null>(null);

  // Sync internal condition when activeCondition prop updates
  useEffect(() => {
    if (propActiveCondition !== undefined) {
      setInternalActiveCondition(propActiveCondition);
    }
  }, [propActiveCondition]);

  const activeCondition = internalActiveCondition;
  const setActiveCondition = (cond: HealthCondition | null) => setInternalActiveCondition(cond);

  const [animationIntensity, setAnimationIntensityState] = useState<AnimationIntensity>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INTENSITY) as AnimationIntensity;
    if (saved === 'subtle') return 'subtle';
    if (saved === 'off') return 'off';
    return 'full';
  });

  const setAnimationIntensity = (intensity: AnimationIntensity) => {
    setAnimationIntensityState(intensity);
    localStorage.setItem(STORAGE_KEY_INTENSITY, intensity);
  };

  // Determine current active theme
  const currentKey = previewCondition || activeCondition;
  const theme = currentKey && CHAKRA_THEMES[currentKey] ? CHAKRA_THEMES[currentKey] : DEFAULT_NEUTRAL_THEME;

  // Apply CSS custom properties dynamically to documentElement
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--chakra-theme-accent', theme.accent);
    root.style.setProperty('--chakra-theme-accent-soft', theme.accentSoft);
    root.style.setProperty('--chakra-theme-secondary', theme.secondaryAccent);
    root.style.setProperty('--chakra-theme-bg-from', theme.bgGradient.from);
    root.style.setProperty('--chakra-theme-bg-via', theme.bgGradient.via);
    root.style.setProperty('--chakra-theme-bg-to', theme.bgGradient.to);
    root.style.setProperty('--chakra-theme-card-bg', theme.cardBg);
    root.style.setProperty('--chakra-theme-card-border', theme.cardBorder);

    // Calm Sound-Reactive Pitch Colors
    root.style.setProperty('--chakra-pitch-in-tune', theme.pitchFeedback.inTune);
    root.style.setProperty('--chakra-pitch-near-tune', theme.pitchFeedback.nearTune);
    root.style.setProperty('--chakra-pitch-off-pitch', theme.pitchFeedback.offPitch);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        activeCondition,
        setActiveCondition,
        previewCondition,
        setPreviewCondition,
        animationIntensity,
        setAnimationIntensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

