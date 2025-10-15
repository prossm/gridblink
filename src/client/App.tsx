import { useCounter } from './hooks/useCounter';
import { useGame } from './hooks/useGame';
import { useLeaderboard } from './hooks/useLeaderboard';
import { SplashScreen } from './components/SplashScreen';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';

export const App = () => {
  const { username } = useCounter();
  const {
    gameState,
    score,
    flashingCircle,
    showSparkles,
    startGame,
    handleCircleClick,
    resetGame,
  } = useGame();

  const { dailyLeaderboard, weeklyLeaderboard, allTimeLeaderboard } = useLeaderboard(
    username || 'anonymous',
    score,
    gameState === 'game-over'
  );

  if (gameState === 'splash') {
    return <SplashScreen onStart={startGame} />;
  }

  if (gameState === 'game-over') {
    return (
      <GameOver
        score={score}
        onPlayAgain={resetGame}
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
    />
  );
};
