/**
 * Game day utilities - handles configurable daily reset for leaderboards and musical scales
 */

/**
 * Gets the current "game day" date string (YYYY-MM-DD format).
 * The game day changes at the configured reset hour in the configured timezone.
 *
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'Europe/London')
 * @param resetHour - Hour of day (0-23) when the game day resets
 *
 * For example (with timezone='America/New_York', resetHour=5):
 * - 4:59am ET on Jan 15 -> returns "2025-01-14"
 * - 5:00am ET on Jan 15 -> returns "2025-01-15"
 * - 11:59pm ET on Jan 15 -> returns "2025-01-15"
 */
export const getGameDayString = (
  timezone: string = 'America/New_York',
  resetHour: number = 5
): string => {
  const now = new Date();

  // Convert current time to the configured timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const tzYear = parseInt(parts.find(p => p.type === 'year')?.value ?? '0');
  const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value ?? '0');
  const tzDay = parseInt(parts.find(p => p.type === 'day')?.value ?? '0');
  const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');

  // If it's before the reset hour, use the previous day
  let gameDay: Date;
  if (tzHour < resetHour) {
    // Use previous day
    gameDay = new Date(tzYear, tzMonth - 1, tzDay - 1);
  } else {
    // Use current day
    gameDay = new Date(tzYear, tzMonth - 1, tzDay);
  }

  // Format as YYYY-MM-DD
  const year = gameDay.getFullYear();
  const month = String(gameDay.getMonth() + 1).padStart(2, '0');
  const day = String(gameDay.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Gets the day-of-year for the current game day (for musical scale rotation).
 * Resets at the configured hour in the configured timezone.
 *
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'Europe/London')
 * @param resetHour - Hour of day (0-23) when the game day resets
 */
export const getGameDayOfYear = (
  timezone: string = 'America/New_York',
  resetHour: number = 5
): number => {
  const gameDayString = getGameDayString(timezone, resetHour);
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
