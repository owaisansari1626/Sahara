/**
 * Sahara v2 — Session & Identity Management Utility
 * 
 * Strict Privacy Contract:
 * - Every client generates and persists a unique `sess-<uuid>` in localStorage on first load.
 * - The fallback "anon-session" is completely eliminated to prevent session collisions.
 * - Shared getSessionId() used consistently across all student endpoints.
 */

const SESSION_STORAGE_KEY = 'sahara_session_id';

/**
 * Generates a standard UUID v4 string with fallback for older environments
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieves the persistent session ID or generates a new one on first load.
 * Format: `sess-<uuid>`
 */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id || !id.startsWith('sess-')) {
      id = `sess-${generateUUID()}`;
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch (err) {
    // If localStorage is blocked (e.g. private mode restriction), generate in-memory session
    return `sess-${generateUUID()}`;
  }
}

/**
 * Resets the current session ID to start a completely fresh anonymous session.
 */
export function resetSessionId(): string {
  const newId = `sess-${generateUUID()}`;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
    // Also clear conversation messages for fresh start
    localStorage.removeItem('sahara_chat_messages');
    localStorage.removeItem('sahara_saathi_active');
  } catch (err) {
    console.error('Could not reset session in storage:', err);
  }
  return newId;
}
