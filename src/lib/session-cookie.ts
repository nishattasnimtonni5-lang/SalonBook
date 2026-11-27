/**
 * Cookie (client origin) that mirrors the BetterAuth session token so the
 * Next.js /api route handlers can resolve the session server-side.
 *
 * Isomorphic by design: imported by the client `<SessionGate>` that writes
 * it and by the server helpers that read it. Never contains anything but
 * the token itself — handlers validate it against MongoDB.
 */
export const SESSION_COOKIE_NAME = "sb_session_token";
