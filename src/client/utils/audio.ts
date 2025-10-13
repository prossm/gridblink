// Audio system for Gridblink game
// Generates pentatonic scale tones for the 9 circles

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

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

// Get today's pentatonic scale
const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

let currentFrequencies: number[] = [];

export const initAudio = () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  currentFrequencies = getPentatonicFrequencies(getDayOfYear());
};

export const playTone = (circleIndex: number, duration: number = 0.3): void => {
  if (!audioContext) return;

  if (currentFrequencies.length === 0) {
    currentFrequencies = getPentatonicFrequencies(getDayOfYear());
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
