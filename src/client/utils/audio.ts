// Audio system for Gridblink game
// Generates pentatonic scale tones for the 9 circles

import { getGameDayOfYear } from '../../shared/utils/gameDay';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

// Pentatonic scale notes (frequencies in Hz)
// Using C major pentatonic: C, D, E, G, A plus upper C, D, E, G
const getPentatonicFrequencies = (dayOfYear: number): number[] => {
  // Base pentatonic scale in C major
  const baseFrequencies = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
  ];

  // Rotate scale based on day of year for variety
  const rotation = dayOfYear % 5;
  return [
    ...baseFrequencies.slice(rotation),
    ...baseFrequencies.slice(0, rotation)
  ].slice(0, 9);
};

let currentFrequencies: number[] = [];
let isMuted = false;
let timeSettings: { timezone: string; resetHour: number } | null = null;

// Fetch time settings from server
async function fetchTimeSettings() {
  try {
    const response = await fetch('/api/settings/time');
    if (!response.ok) throw new Error('Failed to fetch settings');
    timeSettings = await response.json();
  } catch (error) {
    console.error('Error fetching time settings, using defaults:', error);
    timeSettings = { timezone: 'America/New_York', resetHour: 5 };
  }
}

export const initAudio = async () => {
  if (audioContext && audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  // Fetch settings if not already loaded
  if (!timeSettings) {
    await fetchTimeSettings();
  }

  const dayOfYear = getGameDayOfYear(timeSettings!.timezone, timeSettings!.resetHour);
  currentFrequencies = getPentatonicFrequencies(dayOfYear);
};

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = (): boolean => {
  return isMuted;
};

export const playTone = (circleIndex: number, duration: number = 0.3): void => {
  if (!audioContext || isMuted) return;

  if (currentFrequencies.length === 0) {
    // Fallback to defaults if initAudio wasn't called
    const tz = timeSettings?.timezone || 'America/New_York';
    const hour = timeSettings?.resetHour || 5;
    currentFrequencies = getPentatonicFrequencies(getGameDayOfYear(tz, hour));
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = currentFrequencies[circleIndex] || 440;
  oscillator.type = 'sine';

  // Envelope for smooth attack and release
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02); // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay

  oscillator.start(now);
  oscillator.stop(now + duration);
};

export const playGameOverSound = (): void => {
  if (!audioContext || isMuted) return;

  if (currentFrequencies.length === 0) {
    // Fallback to defaults if initAudio wasn't called
    const tz = timeSettings?.timezone || 'America/New_York';
    const hour = timeSettings?.resetHour || 5;
    currentFrequencies = getPentatonicFrequencies(getGameDayOfYear(tz, hour));
  }

  // Get root note (one octave below the lowest note in scale)
  const rootFrequency = (currentFrequencies[0] || 261.63) / 2;
  const duration = 1.1; // 0.5 seconds longer (was 0.6)

  // Create a perfect fifth interval: root + perfect fifth
  const perfectFifth = rootFrequency * 1.5; // 3/2 ratio (perfect fifth)

  // Create two oscillators for the perfect fifth
  const frequencies = [rootFrequency, perfectFifth];

  frequencies.forEach((freq) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = freq;
    oscillator.type = 'sine';

    // Louder and longer envelope for game over (louder than playTone's 0.3)
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.03); // Louder attack (was 0.35)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Longer decay

    oscillator.start(now);
    oscillator.stop(now + duration);
  });
};
