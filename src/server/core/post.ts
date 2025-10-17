import { context, reddit } from '@devvit/web/server';

export const createPost = async (options?: { runAs?: 'USER' | 'APP' }) => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // Splash Screen Configuration
      appDisplayName: 'gridblink',
      backgroundUri: 'splash-background.png',
      buttonLabel: 'Start Playing',
      description: 'Watch, remember, repeat! Test your memory with circles and tones. How far can you go?',
      heading: 'gridblink',
      appIconUri: 'app-icon.png',
    },
    postData: {
      gameState: 'initial',
      score: 0,
    },
    subredditName: subredditName,
    title: 'gridblink - memory & music game',
    runAs: options?.runAs || 'USER', // Default to USER for backwards compatibility
  });
};
