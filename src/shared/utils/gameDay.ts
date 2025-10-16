/**
 * Game day utilities - handles 5am ET reset for daily leaderboards and musical scales
 */

/**
 * Gets the current "game day" date string (YYYY-MM-DD format).
 * The game day changes at 5am Eastern Time, not at midnight.
 *
 * For example:
 * - 4:59am ET on Jan 15 -> returns "2025-01-14"
 * - 5:00am ET on Jan 15 -> returns "2025-01-15"
 * - 11:59pm ET on Jan 15 -> returns "2025-01-15"
 */
export const getGameDayString = (): string => {
  const now = new Date();

  // Convert current time to Eastern Time
  // Use Intl.DateTimeFormat to get ET components
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = etFormatter.formatToParts(now);
  const etYear = parseInt(parts.find(p => p.type === 'year')?.value ?? '0');
  const etMonth = parseInt(parts.find(p => p.type === 'month')?.value ?? '0');
  const etDay = parseInt(parts.find(p => p.type === 'day')?.value ?? '0');
  const etHour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');

  // If it's before 5am ET, use the previous day
  let gameDay: Date;
  if (etHour < 5) {
    // Use previous day
    gameDay = new Date(etYear, etMonth - 1, etDay - 1);
  } else {
    // Use current day
    gameDay = new Date(etYear, etMonth - 1, etDay);
  }

  // Format as YYYY-MM-DD
  const year = gameDay.getFullYear();
  const month = String(gameDay.getMonth() + 1).padStart(2, '0');
  const day = String(gameDay.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Gets the day-of-year for the current game day (for musical scale rotation).
 * Resets at 5am Eastern Time.
 */
export const getGameDayOfYear = (): number => {
  const gameDayString = getGameDayString();
  const parts = gameDayString.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 0;
  const day = parts[2] ?? 0;

  const gameDay = new Date(year, month - 1, day);
  const startOfYear = new Date(year, 0, 0);
  const diff = gameDay.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;

  return Math.floor(diff / oneDay);
};
