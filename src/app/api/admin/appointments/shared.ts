import { headers } from "next/headers"
import { getRequestSession, getRequestSessionToken, buildSessionCookieHeader } from "@/app/lib/server-session"
import { SERVER_API_BASE_URL } from "@/app/lib/api/server-config"

const EXPRESS_BASE = SERVER_API_BASE_URL

type AdminGuard =
  | { ok: true }
  | { ok: false; status: 401 | 403; message: string }

export async function requireAdmin(): Promise<AdminGuard> {
  const session = await getRequestSession()

  if (!session?.user) {
    return {
      ok: false,
      status: 401,
      message: "You must be signed in to manage appointments.",
    }
  }

  const role = (session.user as { role?: string }).role
  if (role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "Admin access is required to manage appointments.",
    }
  }

  return { ok: true }
}

type AppointmentsApiResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; data: { message: string } }

export async function callAppointmentsApi(
  path: string,
  init: { method: "GET" | "PATCH"; body?: unknown }
): Promise<AppointmentsApiResult> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) {
    console.error("INTERNAL_API_SECRET is not configured.")
    return {
      ok: false,
      status: 500,
      data: { message: "Appointments are not configured on the server." },
    }
  }

  // Express guards PATCH /appointments/:id with `requireAdmin`, which resolves
  // the better-auth session from the incoming cookie. The browser only holds
  // that cookie on the backend origin, so this Next request arrives with the
  // mirrored session token instead (see `@/app/lib/server-session`): sign it
  // exactly the way better-call's setSignedCookie does — both apps share
  // BETTER_AUTH_SECRET — so Express can verify it. Without this, every
  // status update is rejected with 401.
  const requestHeaders = await headers()
  const token = await getRequestSessionToken()
  const cookie = token
    ? await buildSessionCookieHeader(token)
    : requestHeaders.get("cookie")

  let response: Response
  try {
    response = await fetch(`${EXPRESS_BASE}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": secret,
        ...(cookie ? { cookie } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      status: 502,
      data: {
        message: "Could not reach the appointments service. Try again later.",
      },
    }
  }

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "The appointments request failed. Please try again."
    return {
      ok: false,
      status: response.status >= 500 ? 502 : response.status,
      data: { message },
    }
  }

  return { ok: true, status: response.status, data }
}
