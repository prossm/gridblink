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
import { getGameDayString } from '../shared/utils/gameDay';

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

      console.log(`[Leaderboard Submit] User: ${username}, Score: ${score}`);

      if (!username) {
        console.log('[Leaderboard Submit] No username - returning 401');
        res.status(401).json({ success: false });
        return;
      }

      const timestamp = Date.now();
      const gameDay = getGameDayString(); // Uses 5am ET reset
      const dailyKey = `leaderboard:daily:${gameDay}`;
      const weeklyKey = `leaderboard:weekly`;
      const allTimeKey = `leaderboard:alltime`;

      // Get user's current best score for today
      const userDailyKey = `user:${username}:daily:${gameDay}`;
      const currentDailyBest = await redis.get(userDailyKey);
      const currentDailyBestScore = currentDailyBest ? parseInt(currentDailyBest) : 0;

      // Get user's current best score for the week
      // Use a dedicated key that stores: score:timestamp
      const userWeeklyKey = `user:${username}:weekly`;
      const userWeeklyData = await redis.get(userWeeklyKey);
      let currentWeeklyBestScore = 0;
      let weeklyTimestamp = 0;

      if (userWeeklyData) {
        const [scoreStr, timestampStr] = userWeeklyData.split(':');
        const storedScore = parseInt(scoreStr || '0');
        weeklyTimestamp = parseInt(timestampStr || '0');
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        // Only use the stored score if it's within the last 7 days
        if (weeklyTimestamp >= sevenDaysAgo) {
          currentWeeklyBestScore = storedScore;
        }
      }

      // Update daily leaderboard if score is better than today's best
      if (score > currentDailyBestScore) {
        await redis.set(userDailyKey, score.toString());

        // Remove old daily entries for this user
        const dailyEntries = await redis.zRange(dailyKey, 0, -1, { by: 'rank' });
        const oldDailyMembers = dailyEntries.filter(e => e.member.startsWith(`${username}:`)).map(e => e.member);

        if (oldDailyMembers.length > 0) {
          await redis.zRem(dailyKey, oldDailyMembers);
        }

        // Add new daily score
        const member = `${username}:${timestamp}`;
        await Promise.all([
          redis.zAdd(dailyKey, { member, score }),
          // Set expiry for daily key (2 days to be safe)
          redis.expire(dailyKey, 172800),
        ]);
      }

      // Update weekly leaderboard if score is better than the user's best in the last 7 days
      if (score > currentWeeklyBestScore) {
        // Store the new best weekly score with timestamp
        await redis.set(userWeeklyKey, `${score}:${timestamp}`);

        // Remove old weekly entries for this user from the sorted set
        const allWeeklyEntries = await redis.zRange(weeklyKey, 0, -1, { by: 'rank' });
        const oldWeeklyMembers = allWeeklyEntries
          .filter(e => e.member.startsWith(`${username}:`))
          .map(e => e.member);

        if (oldWeeklyMembers.length > 0) {
          await redis.zRem(weeklyKey, oldWeeklyMembers);
        }

        // Add new weekly score
        const member = `${username}:${timestamp}`;
        await redis.zAdd(weeklyKey, { member, score });
      }

      // Update all-time leaderboard
      // Get user's current all-time best
      const userAllTimeKey = `user:${username}:alltime`;
      const currentAllTimeBest = await redis.get(userAllTimeKey);
      const currentAllTimeBestScore = currentAllTimeBest ? parseInt(currentAllTimeBest) : 0;

      if (score > currentAllTimeBestScore) {
        // Store the new all-time best
        await redis.set(userAllTimeKey, score.toString());

        // Remove old all-time entries for this user
        const allTimeEntries = await redis.zRange(allTimeKey, 0, -1, { by: 'rank' });
        const oldAllTimeMembers = allTimeEntries
          .filter(e => e.member.startsWith(`${username}:`))
          .map(e => e.member);

        if (oldAllTimeMembers.length > 0) {
          await redis.zRem(allTimeKey, oldAllTimeMembers);
        }

        // Add new all-time score
        const member = `${username}:${timestamp}`;
        await redis.zAdd(allTimeKey, { member, score });

        // Keep only top 100 - remove entries beyond rank 100
        const allTimeCount = await redis.zCard(allTimeKey);
        if (allTimeCount > 100) {
          // Remove lowest scores (remember: 0 is highest rank in ascending order)
          await redis.zRemRangeByRank(allTimeKey, 0, allTimeCount - 101);
        }
      }

      console.log(`[Leaderboard Submit] Success for ${username} with score ${score}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ success: false });
    }
  }
);

router.get<unknown, LeaderboardResponse>('/api/leaderboard/daily', async (_req, res): Promise<void> => {
  try {
    const gameDay = getGameDayString(); // Uses 5am ET reset
    const dailyKey = `leaderboard:daily:${gameDay}`;

    console.log('[Leaderboard Fetch] Fetching daily leaderboard');
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

    console.log(`[Leaderboard Fetch] Daily entries: ${entries.length}`);
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

router.get<unknown, LeaderboardResponse>('/api/leaderboard/alltime', async (_req, res): Promise<void> => {
  try {
    const allTimeKey = `leaderboard:alltime`;

    // Get top 100 scores in descending order
    const results = await redis.zRange(allTimeKey, 0, 99, { by: 'rank', reverse: true });

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
    console.error('Error fetching all-time leaderboard:', error);
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
