import { useState, useEffect } from 'react';
import { setMuted } from '../utils/audio';

const STORAGE_KEY = 'gridblink_sound_enabled';

export const useSound = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Initialize from localStorage, default to true (sound on)
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    // Sync with audio utility
    setMuted(!isSoundEnabled);
  }, [isSoundEnabled]);

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const newValue = !prev;
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  };

  return {
    isSoundEnabled,
    toggleSound,
  };
};
