/**
 * Shared Express API base-URL resolution (safe to import from client and
 * server code — only reads `NEXT_PUBLIC_*` vars plus `NODE_ENV`).
 *
 * Local development keeps whatever is configured in `.env` and falls back to
 * `http://localhost:8000`, so `next dev` behaves exactly as before.
 *
 * In production a missing value — or one that still points at localhost —
 * resolves to the deployed backend instead of a dead localhost URL.
 */

/** Deployed Express backend. */
export const PRODUCTION_API_URL = "https://salon-book-server-six.vercel.app"

/** Backend origin used during local development. */
export const LOCAL_API_URL = "http://localhost:8000"

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, "")

const isLocalhost = (url: string): boolean => {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    )
  } catch {
    return false
  }
}

/**
 * Resolve a backend URL.
 *
 * @param configured value from the environment (may be unset or localhost)
 * @param path       endpoint path appended to the default origin, e.g. "/offers"
 */
export function resolveApiUrl(configured: string | undefined, path = ""): string {
  const value = configured?.trim()

  if (process.env.NODE_ENV === "production") {
    // Production must never call localhost: use the configured origin when it
    // is a real (non-localhost) URL, otherwise the deployed backend.
    return trimTrailingSlash(
      value && !isLocalhost(value) ? value : `${PRODUCTION_API_URL}${path}`
    )
  }

  // Development: honour `.env`, defaulting to the local backend.
  return trimTrailingSlash(value || `${LOCAL_API_URL}${path}`)
}

/** Origin of the Express API, without a trailing slash (e.g. `/appointments`). */
export const API_BASE_URL = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL)

/** Full offers endpoint (`{API}/offers`). */
export const OFFERS_API_URL = resolveApiUrl(
  process.env.NEXT_PUBLIC_OFFERS_API_URL,
  "/offers"
)
