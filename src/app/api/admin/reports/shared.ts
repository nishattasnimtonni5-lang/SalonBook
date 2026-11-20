import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"

const EXPRESS_BASE = process.env.EXPRESS_API_URL ?? "http://localhost:8000"

type AdminGuard =
  | { ok: true }
  | { ok: false; status: 401 | 403; message: string }

export async function requireAdmin(): Promise<AdminGuard> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return {
      ok: false,
      status: 401,
      message: "You must be signed in to manage reports.",
    }
  }

  const role = (session.user as { role?: string }).role
  if (role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "Admin access is required to manage reports.",
    }
  }

  return { ok: true }
}

type ReportsApiResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; data: { message: string } }

export async function callReportsApi(
  path: string,
  init: { method: "GET" | "PATCH"; body?: unknown }
): Promise<ReportsApiResult> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) {
    console.error("INTERNAL_API_SECRET is not configured.")
    return {
      ok: false,
      status: 500,
      data: { message: "Reports are not configured on the server." },
    }
  }

  let response: Response
  try {
    response = await fetch(`${EXPRESS_BASE}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": secret,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      status: 502,
      data: { message: "Could not reach the reports service. Try again later." },
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
        : "The reports request failed. Please try again."
    return {
      ok: false,
      status: response.status >= 500 ? 502 : response.status,
      data: { message },
    }
  }

  return { ok: true, status: response.status, data }
}
