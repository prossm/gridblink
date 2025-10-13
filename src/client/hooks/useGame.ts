import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState } from '../types/game';
import { playTone, initAudio } from '../utils/audio';

const FLASH_DURATION = 600; // ms
const FLASH_GAP = 400; // ms
const PLAYER_TIMEOUT = 5000; // ms
const MAX_SEQUENCE_LENGTH = 200;

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>('splash');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [flashingCircle, setFlashingCircle] = useState<number | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);

  const playerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const playComputerSequence = useCallback(async (seq: number[]) => {
    setGameState('computer-turn');
    setPlayerSequence([]);

    for (let i = 0; i < seq.length; i++) {
      const circleIndex = seq[i];
      if (circleIndex !== undefined) {
        await new Promise((resolve) => setTimeout(resolve, FLASH_GAP));
        setFlashingCircle(circleIndex);
        playTone(circleIndex);
        await new Promise((resolve) => setTimeout(resolve, FLASH_DURATION));
        setFlashingCircle(null);
      }
    }

    // Start player turn
    setGameState('player-turn');
    lastInputTimeRef.current = Date.now();

    // Set timeout for player inactivity
    playerTimeoutRef.current = setTimeout(() => {
      setGameState('game-over');
    }, PLAYER_TIMEOUT);
  }, []);

  // Handle player click
  const handleCircleClick = useCallback(
    (index: number) => {
      if (gameState !== 'player-turn') return;

      // Reset inactivity timer
      lastInputTimeRef.current = Date.now();
      if (playerTimeoutRef.current) {
        clearTimeout(playerTimeoutRef.current);
      }

      // Flash and play tone
      setFlashingCircle(index);
      playTone(index);
      setTimeout(() => setFlashingCircle(null), FLASH_DURATION);

      const newPlayerSequence = [...playerSequence, index];
      setPlayerSequence(newPlayerSequence);

      // Check if correct
      if (index !== sequence[newPlayerSequence.length - 1]) {
        // Wrong! Game over
        if (playerTimeoutRef.current) {
          clearTimeout(playerTimeoutRef.current);
        }
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
        }, 1000);
      } else {
        // Continue player turn with refreshed timeout
        playerTimeoutRef.current = setTimeout(() => {
          setGameState('game-over');
        }, PLAYER_TIMEOUT);
      }
    },
    [gameState, playerSequence, sequence, score]
  );

  // Play computer sequence when sequence changes
  useEffect(() => {
    if (sequence.length > 0 && gameState === 'computer-turn') {
      playComputerSequence(sequence);
    }
  }, [sequence, gameState, playComputerSequence]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (playerTimeoutRef.current) {
        clearTimeout(playerTimeoutRef.current);
      }
    };
  }, []);

  const resetGame = useCallback(() => {
    if (playerTimeoutRef.current) {
      clearTimeout(playerTimeoutRef.current);
    }
    setGameState('splash');
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setFlashingCircle(null);
    setShowSparkles(false);
  }, []);

  return {
    gameState,
    sequence,
    playerSequence,
    score,
    flashingCircle,
    showSparkles,
    startGame,
    handleCircleClick,
    resetGame,
  };
};
