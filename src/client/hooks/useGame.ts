import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState } from '../types/game';
import { playTone, initAudio, playGameOverSound } from '../utils/audio';

const BASE_FLASH_DURATION = 600; // ms
const BASE_FLASH_GAP = 400; // ms
const PLAYER_TIMEOUT = 5000; // ms
const MAX_SEQUENCE_LENGTH = 200;
const GAME_SPEED_STORAGE_KEY = 'gridblink_game_speed';

export type GameSpeed = 1 | 1.5 | 2;

interface UseGameProps {
  initialPersonalBest?: number;
}

export const useGame = ({ initialPersonalBest = 0 }: UseGameProps = {}) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [personalBest, setPersonalBest] = useState(initialPersonalBest);
  const [flashingCircle, setFlashingCircle] = useState<number | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(() => {
    // Initialize from localStorage, default to 1x for new players
    if (typeof window === 'undefined') return 1;
    const stored = localStorage.getItem(GAME_SPEED_STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (parsed === 1 || parsed === 1.5 || parsed === 2) {
        return parsed as GameSpeed;
      }
    }
    return 1;
  });

  const playerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInputTimeRef = useRef<number>(Date.now());

  // Start game
  const startGame = useCallback(() => {
    initAudio();
    setGameState('computer-turn');
    setScore(0);
    setSequence([]);
    setPlayerSequence([]);
    const firstCircle = Math.floor(Math.random() * 9);
    setSequence([firstCircle]);
  }, []);

  // Play computer sequence
  const playComputerSequence = useCallback(async (seq: number[], currentScore: number, speed: GameSpeed) => {
    console.log('[Game] Computer turn starting, sequence length:', seq.length);
    setGameState('computer-turn');
    setPlayerSequence([]);

    // Speed up after round 5, then apply game speed multiplier
    const roundSpeedMultiplier = currentScore >= 5 ? 0.75 : 1;
    const adjustedFlashDuration = (BASE_FLASH_DURATION * roundSpeedMultiplier) / speed;
    const adjustedFlashGap = (BASE_FLASH_GAP * roundSpeedMultiplier) / speed;

    for (let i = 0; i < seq.length; i++) {
      const circleIndex = seq[i];
      if (circleIndex !== undefined) {
        await new Promise((resolve) => setTimeout(resolve, adjustedFlashGap));
        setFlashingCircle(circleIndex);
        playTone(circleIndex);
        await new Promise((resolve) => setTimeout(resolve, adjustedFlashDuration));
        setFlashingCircle(null);
      }
    }

    // Add small delay before enabling player input to ensure last flash completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Start player turn
    console.log('[Game] Player turn starting - circles should be clickable now');
    setGameState('player-turn');
    lastInputTimeRef.current = Date.now();

    // Set timeout for player inactivity
    playerTimeoutRef.current = setTimeout(() => {
      console.log('[Game] Player timeout - no input received');
      playGameOverSound();
      setGameState('game-over');
    }, PLAYER_TIMEOUT);
  }, []);

  // Handle player click
  const handleCircleClick = useCallback(
    (index: number) => {
      if (gameState !== 'player-turn') {
        console.log('[Game] Click ignored - not player turn. Current state:', gameState);
        return;
      }
      console.log('[Game] Circle clicked:', index, '- Expected:', sequence[playerSequence.length]);

      // Reset inactivity timer
      lastInputTimeRef.current = Date.now();
      if (playerTimeoutRef.current) {
        clearTimeout(playerTimeoutRef.current);
      }

      // Flash and play tone
      setFlashingCircle(index);
      playTone(index);
      setTimeout(() => setFlashingCircle(null), BASE_FLASH_DURATION);

      const newPlayerSequence = [...playerSequence, index];
      setPlayerSequence(newPlayerSequence);

      // Check if correct
      if (index !== sequence[newPlayerSequence.length - 1]) {
        // Wrong! Game over
        if (playerTimeoutRef.current) {
          clearTimeout(playerTimeoutRef.current);
        }
        playGameOverSound();
        setGameState('game-over');
        return;
      }

      // Check if sequence complete
      if (newPlayerSequence.length === sequence.length) {
        // Correct sequence completed!
        if (playerTimeoutRef.current) {
          clearTimeout(playerTimeoutRef.current);
        }

        const newScore = score + 1;
        setScore(newScore);

        // Update personal best if exceeded
        // Note: Personal best is also saved to Redis via the leaderboard submit endpoint
        if (newScore > personalBest) {
          setPersonalBest(newScore);
        }

        // Show celebration
        setShowSparkles(true);
        setTimeout(() => setShowSparkles(false), 800);

        // Check if reached max
        if (newScore >= MAX_SEQUENCE_LENGTH) {
          setTimeout(() => setGameState('game-over'), 1000);
          return;
        }

        // Add new circle to sequence
        setTimeout(() => {
          const nextCircle = Math.floor(Math.random() * 9);
          const newSequence = [...sequence, nextCircle];
          setSequence(newSequence);
          setGameState('computer-turn');
        }, 1000);
      } else {
        // Continue player turn with refreshed timeout
        playerTimeoutRef.current = setTimeout(() => {
          playGameOverSound();
          setGameState('game-over');
        }, PLAYER_TIMEOUT);
      }
    },
    [gameState, playerSequence, sequence, score, personalBest]
  );

  // Sync personal best from server when it changes
  useEffect(() => {
    if (initialPersonalBest > personalBest) {
      setPersonalBest(initialPersonalBest);
    }
  }, [initialPersonalBest, personalBest]);

  // Play computer sequence when sequence changes
  useEffect(() => {
    if (sequence.length > 0 && gameState === 'computer-turn') {
      void playComputerSequence(sequence, score, gameSpeed);
    }
  }, [sequence, gameState, score, gameSpeed, playComputerSequence]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (playerTimeoutRef.current) {
        clearTimeout(playerTimeoutRef.current);
      }
    };
  }, []);

  // Persist game speed to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GAME_SPEED_STORAGE_KEY, gameSpeed.toString());
    }
  }, [gameSpeed]);

  const resetGame = useCallback(() => {
    if (playerTimeoutRef.current) {
      clearTimeout(playerTimeoutRef.current);
    }
    setGameState('intro');
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setFlashingCircle(null);
    setShowSparkles(false);
  }, []);

  const playAgain = useCallback(() => {
    if (playerTimeoutRef.current) {
      clearTimeout(playerTimeoutRef.current);
    }
    setGameState('computer-turn');
    setScore(0);
    setPlayerSequence([]);
    setFlashingCircle(null);
    setShowSparkles(false);
    const firstCircle = Math.floor(Math.random() * 9);
    setSequence([firstCircle]);
  }, []);

  return {
    gameState,
    sequence,
    playerSequence,
    score,
    personalBest,
    flashingCircle,
    showSparkles,
    gameSpeed,
    setGameSpeed,
    startGame,
    handleCircleClick,
    resetGame,
    playAgain,
  };
};
