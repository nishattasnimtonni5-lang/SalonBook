/**
 * Server-only Express API URLs (route handlers / shared server helpers).
 *
 * These read non-`NEXT_PUBLIC` environment variables, so this module must only
 * be imported from server code. Resolution rules — including the
 * "never localhost in production" guarantee — live in `./config`.
 */

import { resolveApiUrl } from "./config"

/**
 * Express origin for Next.js server routes.
 *
 * Prefers the dedicated `EXPRESS_API_URL` var, then `NEXT_PUBLIC_API_URL`.
 * Falls back to `http://localhost:8000` in development and to the deployed
 * backend in production.
 */
export const SERVER_API_BASE_URL = resolveApiUrl(
  process.env.EXPRESS_API_URL ?? process.env.NEXT_PUBLIC_API_URL
)

/** Full reports endpoint (`{API}/reports`). */
export const REPORTS_API_URL = resolveApiUrl(
  process.env.REPORTS_API_URL,
  "/reports"
)
