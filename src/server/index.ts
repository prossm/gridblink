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
import { redis, reddit, createServer, context, getServerPort, settings } from '@devvit/web/server';
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

// Helper to get timezone and reset hour settings
async function getTimeSettings() {
  const [timezone, resetHour] = await Promise.all([
    settings.get('timezone'),
    settings.get('dailyResetHour'),
  ]);
  return {
    timezone: (timezone as string) || 'America/New_York',
    resetHour: parseInt((resetHour as string) || '5', 10),
  };
}

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

      // Get user's personal best
      let personalBest = 0;
      if (username) {
        const userPersonalBestKey = `user:${username}:personal_best`;
        const storedBest = await redis.get(userPersonalBestKey);
        personalBest = storedBest ? parseInt(storedBest) : 0;
      }

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
        personalBest: personalBest,
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
      const { timezone, resetHour } = await getTimeSettings();
      const gameDay = getGameDayString(timezone, resetHour);
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
        const oldDailyMembers = dailyEntries
          .filter((e) => e.member.startsWith(`${username}:`))
          .map((e) => e.member);

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
          .filter((e) => e.member.startsWith(`${username}:`))
          .map((e) => e.member);

        if (oldWeeklyMembers.length > 0) {
          await redis.zRem(weeklyKey, oldWeeklyMembers);
        }

        // Add new weekly score
        const member = `${username}:${timestamp}`;
        await redis.zAdd(weeklyKey, { member, score });
      }

      // Update personal best (all-time)
      const userPersonalBestKey = `user:${username}:personal_best`;
      const currentPersonalBest = await redis.get(userPersonalBestKey);
      const currentPersonalBestScore = currentPersonalBest ? parseInt(currentPersonalBest) : 0;

      if (score > currentPersonalBestScore) {
        // Store the new personal best
        await redis.set(userPersonalBestKey, score.toString());
      }

      // Add user to the all-players sorted set (for statistics tracking)
      // Using timestamp as score so we can see when they first played
      const firstPlayKey = `user:${username}:first_play`;
      const firstPlay = await redis.get(firstPlayKey);
      if (!firstPlay) {
        await redis.set(firstPlayKey, timestamp.toString());
        await redis.zAdd('all_players', { member: username, score: timestamp });
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
          .filter((e) => e.member.startsWith(`${username}:`))
          .map((e) => e.member);

        if (oldAllTimeMembers.length > 0) {
          await redis.zRem(allTimeKey, oldAllTimeMembers);
        }

        // Add new all-time score
        const member = `${username}:${timestamp}`;
        await redis.zAdd(allTimeKey, { member, score });

        // Note: We no longer prune the all-time leaderboard here
        // This preserves all historical data for statistics
        // The display limit is handled in the GET endpoint
      }

      console.log(`[Leaderboard Submit] Success for ${username} with score ${score}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ success: false });
    }
  }
);

// API endpoint to get timezone settings for client
router.get('/api/settings/time', async (_req, res): Promise<void> => {
  try {
    const timeSettings = await getTimeSettings();
    res.json(timeSettings);
  } catch (error) {
    console.error('Error fetching time settings:', error);
    res.status(500).json({
      timezone: 'America/New_York',
      resetHour: 5,
    });
  }
});

router.get<unknown, LeaderboardResponse>(
  '/api/leaderboard/daily',
  async (_req, res): Promise<void> => {
    try {
      const { timezone, resetHour } = await getTimeSettings();
      const gameDay = getGameDayString(timezone, resetHour);
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
  }
);

router.get<unknown, LeaderboardResponse>(
  '/api/leaderboard/weekly',
  async (_req, res): Promise<void> => {
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
  }
);

router.get<unknown, LeaderboardResponse>(
  '/api/leaderboard/alltime',
  async (_req, res): Promise<void> => {
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
  }
);

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

router.post('/internal/scheduler/daily-post', async (_req, res): Promise<void> => {
  console.log(`[Scheduler] ========== DAILY POST SCHEDULER TRIGGERED ==========`);
  console.log(`[Scheduler] Time: ${new Date().toISOString()}`);
  console.log(`[Scheduler] Subreddit: ${context.subredditName}`);

  try {
    // Get auto-posting settings
    const [enableAutoPosting, autoPostHour, timezone] = await Promise.all([
      settings.get('enableAutoPosting'),
      settings.get('autoPostHour'),
      settings.get('timezone'),
    ]);

    const isAutoPostEnabled = enableAutoPosting !== false; // Default to true
    const configuredHour = parseInt((autoPostHour as string) || '5', 10);
    const tz = (timezone as string) || 'America/New_York';

    console.log(`[Scheduler] Auto-posting enabled: ${isAutoPostEnabled}`);
    console.log(`[Scheduler] Configured post hour: ${configuredHour} (${tz})`);

    if (!isAutoPostEnabled) {
      console.log(`[Scheduler] ⏭️ SKIPPED: Auto-posting is disabled for this subreddit`);
      res.json({
        status: 'skipped',
        message: 'Auto-posting is disabled',
      });
      return;
    }

    // Check if current hour matches configured hour in the configured timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0');

    console.log(`[Scheduler] Current hour in ${tz}: ${currentHour}`);

    if (currentHour !== configuredHour) {
      console.log(
        `[Scheduler] ⏭️ SKIPPED: Not the configured post time (current: ${currentHour}, configured: ${configuredHour})`
      );
      res.json({
        status: 'skipped',
        message: `Not the configured post time (current: ${currentHour}, configured: ${configuredHour})`,
      });
      return;
    }

    // Run as APP since scheduler has no user context
    const post = await createPost({ runAs: 'APP' });

    console.log(`[Scheduler] ✅ SUCCESS: Created post ${post.id} in r/${context.subredditName}`);
    res.json({
      status: 'success',
      message: `Daily post created: ${post.id}`,
      postId: post.id,
    });
  } catch (error) {
    console.error(`[Scheduler] ❌ ERROR: Failed to create daily post`);
    console.error(`[Scheduler] Error details:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create daily post',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Subscribe to subreddit endpoint
router.post('/api/subscribe', async (_req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Subscribe the user to the current subreddit
    await reddit.subscribeToCurrentSubreddit();

    // Store subscription state in Redis
    const subscriptionKey = `user:${username}:subscribed`;
    await redis.set(subscriptionKey, 'true');

    console.log(`[Subscribe] User ${username} subscribed to r/${context.subredditName}`);

    res.json({
      success: true,
      message: `Subscribed to r/${context.subredditName}`,
    });
  } catch (error) {
    console.error('[Subscribe] Error subscribing user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe',
    });
  }
});

// Check subscription status endpoint
router.get('/api/subscribe/status', async (_req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.json({ isSubscribed: false });
      return;
    }

    // Check Redis for subscription state
    const subscriptionKey = `user:${username}:subscribed`;
    const isSubscribed = await redis.get(subscriptionKey);

    res.json({ isSubscribed: isSubscribed === 'true' });
  } catch (error) {
    console.error('[Subscribe] Error checking subscription status:', error);
    res.json({ isSubscribed: false });
  }
});

// Player statistics endpoint
router.get('/api/stats/player-count', async (_req, res): Promise<void> => {
  try {
    let totalPlayers = await redis.zCard('all_players');

    // If all_players is empty, initialize it from existing leaderboards
    if (totalPlayers === 0) {
      console.log('[Stats] Initializing all_players from existing data...');

      // Get all unique usernames from all leaderboards
      const uniqueUsernames = new Set<string>();
      const timestamp = Date.now();

      // Get all-time leaderboard (might be pruned to 100)
      const allTimeKey = 'leaderboard:alltime';
      const allTimeEntries = await redis.zRange(allTimeKey, 0, -1, { by: 'rank' });
      for (const entry of allTimeEntries) {
        const [username] = entry.member.split(':');
        if (username) uniqueUsernames.add(username);
      }

      // Get weekly leaderboard
      const weeklyKey = 'leaderboard:weekly';
      const weeklyEntries = await redis.zRange(weeklyKey, 0, -1, { by: 'rank' });
      for (const entry of weeklyEntries) {
        const [username] = entry.member.split(':');
        if (username) uniqueUsernames.add(username);
      }

      // Get daily leaderboard (current day)
      const { timezone, resetHour } = await getTimeSettings();
      const gameDay = getGameDayString(timezone, resetHour);
      const dailyKey = `leaderboard:daily:${gameDay}`;
      const dailyEntries = await redis.zRange(dailyKey, 0, -1, { by: 'rank' });
      for (const entry of dailyEntries) {
        const [username] = entry.member.split(':');
        if (username) uniqueUsernames.add(username);
      }

      // Add all unique players to the all_players set
      if (uniqueUsernames.size > 0) {
        for (const username of uniqueUsernames) {
          await redis.zAdd('all_players', { member: username, score: timestamp });
        }
        totalPlayers = uniqueUsernames.size;
        console.log(`[Stats] Initialized all_players with ${totalPlayers} existing players`);
      }
    }

    res.json({
      totalPlayers,
      description: 'Total unique players who have ever played the game',
    });
  } catch (error) {
    console.error('[Stats] Error counting players:', error);
    res.status(500).json({
      totalPlayers: 0,
      error: 'Failed to count players',
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
