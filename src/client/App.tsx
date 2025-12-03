import { useCounter } from './hooks/useCounter';
import { useGame } from './hooks/useGame';
import { useLeaderboard } from './hooks/useLeaderboard';
import { IntroScreen } from './components/IntroScreen';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';

export const App = () => {
  const { username, personalBest: serverPersonalBest } = useCounter();
  const {
    gameState,
    score,
    personalBest,
    flashingCircle,
    showSparkles,
    gameSpeed,
    setGameSpeed,
    startGame,
    handleCircleClick,
    playAgain,
  } = useGame({ initialPersonalBest: serverPersonalBest });

  const { dailyLeaderboard, weeklyLeaderboard, allTimeLeaderboard } = useLeaderboard(
    username || 'anonymous',
    score,
    gameState === 'game-over'
  );

  if (gameState === 'intro') {
    return (
      <IntroScreen onStart={startGame} gameSpeed={gameSpeed} onGameSpeedChange={setGameSpeed} />
    );
  }

  if (gameState === 'game-over') {
    return (
      <GameOver
        score={score}
        onPlayAgain={playAgain}
        username={username || 'anonymous'}
        dailyLeaderboard={dailyLeaderboard}
        weeklyLeaderboard={weeklyLeaderboard}
        allTimeLeaderboard={allTimeLeaderboard}
      />
    );
  }

  return (
    <GameBoard
      flashingCircle={flashingCircle}
      onCircleClick={handleCircleClick}
      isPlayerTurn={gameState === 'player-turn'}
      showSparkles={showSparkles}
      score={score}
      personalBest={personalBest}
    />
  );
};
