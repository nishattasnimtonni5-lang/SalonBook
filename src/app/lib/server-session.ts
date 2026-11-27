import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

/**
 * Server-side helpers for resolving the BetterAuth session of an incoming
 * Next.js API request.
 *
 * Why this exists: the real session cookie is set on the *backend* domain
 * (`salon-book-server-six.vercel.app`), so the browser never sends it to
 * this app's origin and `auth.api.getSession({ headers })` always returned
 * null here — every /api route answered 401 with "You must be signed in…"
 * even for signed-in admins.
 *
 * `<SessionGate>` (which every dashboard layout wraps its pages in) mirrors
 * the session token into the same-origin `sb_session_token` cookie before
 * children render. These helpers read that cookie and resolve the session
 * straight from MongoDB via the local auth instance — no signature to forge
 * for our own checks, because the token itself is the credential.
 */

/** Read the mirrored session token out of a Cookie header value. */
function parseSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    const value = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

/** Session token for the current request, or null when absent. */
export async function getRequestSessionToken(): Promise<string | null> {
  return parseSessionToken((await headers()).get("cookie"));
}

/**
 * Resolve the BetterAuth session (`{ session, user }` or null) for the
 * current request.
 *
 * `internalAdapter.findSession()` matches by raw token but also returns
 * *expired* rows, so the expiry is enforced here — same guarantee
 * `auth.api.getSession()` would give if it could see this request's cookie.
 */
export async function getRequestSession() {
  const token = await getRequestSessionToken();
  if (!token) return null;

  const ctx = await auth.$context;
  const found = await ctx.internalAdapter.findSession(token);
  if (!found) return null;

  const expiresAt = new Date(found.session.expiresAt).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  return found;
}

/**
 * Sign a session token the way better-call's `setSignedCookie` does
 * (HMAC-SHA256 over the raw token, standard base64, whole value
 * percent-encoded), producing a Cookie header value the *backend*'s
 * `auth.api.getSession()` will accept.
 *
 * Needed when this server forwards a request to an Express endpoint guarded
 * by BetterAuth's session cookie (e.g. `PATCH /appointments/:id`). Both apps
 * share `BETTER_AUTH_SECRET`, so the signature verifies there.
 */
export async function signSessionCookieValue(token: string): Promise<string> {
  const ctx = await auth.$context;
  const signature = createHmac("sha256", ctx.secret)
    .update(token)
    .digest("base64");
  return encodeURIComponent(`${token}.${signature}`);
}

/**
 * Full `Cookie` header value (`<name>=<signed value>`) that the backend's
 * `auth.api.getSession()` will accept for this token.
 *
 * The cookie NAME comes from the auth context rather than a literal:
 * secure deployments use the `__Secure-` prefix
 * (`__Secure-better-auth.session_token`), and hardcoding the unprefixed name
 * makes Express look for a cookie that was never sent → 401.
 */
export async function buildSessionCookieHeader(token: string): Promise<string> {
  const ctx = await auth.$context;
  return `${ctx.authCookies.sessionToken.name}=${await signSessionCookieValue(token)}`;
}
