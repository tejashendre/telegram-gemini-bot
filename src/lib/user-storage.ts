/**
 * User Storage Utility
 *
 * Tracks Telegram chat IDs for sending daily reports.
 * Uses an in-memory Set that is seeded from the TELEGRAM_SUBSCRIBED_USERS
 * environment variable on cold start. Runtime changes (subscribe/unsubscribe)
 * persist for the lifetime of the serverless function invocation.
 *
 * For cross-invocation persistence the env var is still the source of truth.
 * Format: Comma-separated chat IDs in TELEGRAM_SUBSCRIBED_USERS env var
 * Example: "123456789,987654321,111222333"
 */

const STORAGE_KEY = "TELEGRAM_SUBSCRIBED_USERS";

/** In-memory set initialised lazily from the env var. */
let _users: Set<string> | null = null;

const DEFAULT_USERS = "6909425236,1136519301";

function ensureLoaded(): Set<string> {
  if (_users !== null) return _users;
  // Combine env var AND default users to ensure everyone is covered
  const rawEnv = process.env[STORAGE_KEY] || "";
  const combined = \`\${rawEnv},\${DEFAULT_USERS}\`;
  
  _users = new Set<string>();
  for (const id of combined.split(",")) {
    const trimmed = id.trim();
    if (trimmed.length > 0) _users.add(trimmed);
  }
  return _users;
}

/**
 * Get all subscribed user chat IDs
 */
export function getSubscribedUsers(): string[] {
  return Array.from(ensureLoaded());
}

/**
 * Check if a user is subscribed
 */
export function isUserSubscribed(chatId: string): boolean {
  return ensureLoaded().has(chatId);
}

/**
 * Add a user to subscriptions (persists in-memory for this invocation)
 */
export function addUser(chatId: string): { success: boolean; message: string } {
  const users = ensureLoaded();

  if (users.has(chatId)) {
    return {
      success: false,
      message: "You're already subscribed to daily reports! 📊",
    };
  }

  users.add(chatId);
  console.log(
    `[user - storage] User ${ chatId } subscribed(now ${ users.size } total). ` +
    `Ensure ${ STORAGE_KEY } in Vercel includes this ID for persistence across deploys.`
  );

  return {
    success: true,
    message:
      `✅ You're subscribed! You'll receive daily financial reports at 8 AM IST.\n\n` +
      `Your Chat ID: ${ chatId } \n` +
      `Please share this ID with the bot admin so it can be saved permanently.`,
  };
}

/**
 * Remove a user from subscriptions
 */
export function removeUser(chatId: string): { success: boolean; message: string } {
  const users = ensureLoaded();

  if (!users.has(chatId)) {
    return {
      success: false,
      message: "You're not subscribed to daily reports.",
    };
  }

  users.delete(chatId);
  console.log(
    `[user - storage] User ${ chatId } unsubscribed(now ${ users.size } total). ` +
    `Remove from ${ STORAGE_KEY } in Vercel for persistence.`
  );

  return {
    success: true,
    message: "❌ You've unsubscribed from daily reports.",
  };
}

/**
 * Get user count
 */
export function getUserCount(): number {
  return ensureLoaded().size;
}
