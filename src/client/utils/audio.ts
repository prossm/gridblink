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

export const initAudio = () => {
  if (audioContext && audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  currentFrequencies = getPentatonicFrequencies(getGameDayOfYear());
};

export const playTone = (circleIndex: number, duration: number = 0.3): void => {
  if (!audioContext) return;

  if (currentFrequencies.length === 0) {
    currentFrequencies = getPentatonicFrequencies(getGameDayOfYear());
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
  if (!audioContext) return;

  if (currentFrequencies.length === 0) {
    currentFrequencies = getPentatonicFrequencies(getGameDayOfYear());
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
