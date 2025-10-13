import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // Splash Screen Configuration
      appDisplayName: 'Gridblink',
      backgroundUri: 'default-splash.png',
      buttonLabel: 'Play Now',
      description: 'Test your memory with this musical pattern game!',
      heading: 'Gridblink',
      appIconUri: 'default-icon.png',
    },
    postData: {
      gameState: 'initial',
      score: 0,
    },
    subredditName: subredditName,
    title: 'Gridblink - Memory & Music Game',
  });
};
