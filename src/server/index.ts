import express from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  LeaderboardResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
  LeaderboardEntry,
} from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// Leaderboard endpoints
router.post<unknown, SubmitScoreResponse, SubmitScoreRequest>(
  '/api/leaderboard/submit',
  async (req, res): Promise<void> => {
    try {
      const { score } = req.body;
      const username = await reddit.getCurrentUsername();

      if (!username) {
        res.status(401).json({ success: false });
        return;
      }

      const timestamp = Date.now();
      const dailyKey = `leaderboard:daily:${new Date().toISOString().split('T')[0]}`;
      const weeklyKey = `leaderboard:weekly`;

      // Get user's current best score for today
      const userDailyKey = `user:${username}:daily:${new Date().toISOString().split('T')[0]}`;
      const currentBest = await redis.get(userDailyKey);
      const currentBestScore = currentBest ? parseInt(currentBest) : 0;

      // Only update if new score is better
      if (score > currentBestScore) {
        await redis.set(userDailyKey, score.toString());

        // Store score in sorted sets (score as score, username:timestamp as member)
        const member = `${username}:${timestamp}`;
        await Promise.all([
          redis.zAdd(dailyKey, { member, score }),
          redis.zAdd(weeklyKey, { member, score }),
          // Set expiry for daily key (2 days to be safe)
          redis.expire(dailyKey, 172800),
        ]);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ success: false });
    }
  }
);

router.get<unknown, LeaderboardResponse>('/api/leaderboard/daily', async (_req, res): Promise<void> => {
  try {
    const dailyKey = `leaderboard:daily:${new Date().toISOString().split('T')[0]}`;

    // Get top scores in descending order
    const results = await redis.zRange(dailyKey, 0, 99, { by: 'rank', reverse: true });

    const entries: LeaderboardEntry[] = results.map((item) => {
      const [username, timestampStr] = item.member.split(':');
      return {
        username: username || 'anonymous',
        score: item.score,
        timestamp: parseInt(timestampStr || '0'),
      };
    });

    res.json({ entries });
  } catch (error) {
    console.error('Error fetching daily leaderboard:', error);
    res.status(500).json({ entries: [] });
  }
});

router.get<unknown, LeaderboardResponse>('/api/leaderboard/weekly', async (_req, res): Promise<void> => {
  try {
    const weeklyKey = `leaderboard:weekly`;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Remove old entries (older than 7 days)
    const allEntries = await redis.zRange(weeklyKey, 0, -1, { by: 'rank' });
    for (const item of allEntries) {
      const [, timestampStr] = item.member.split(':');
      const timestamp = parseInt(timestampStr || '0');
      if (timestamp < sevenDaysAgo) {
        await redis.zRem(weeklyKey, [item.member]);
      }
    }

    // Get top scores
    const results = await redis.zRange(weeklyKey, 0, 99, { by: 'rank', reverse: true });

    const entries: LeaderboardEntry[] = results.map((item) => {
      const [username, timestampStr] = item.member.split(':');
      return {
        username: username || 'anonymous',
        score: item.score,
        timestamp: parseInt(timestampStr || '0'),
      };
    });

    res.json({ entries });
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    res.status(500).json({ entries: [] });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
