import { getRequestSession } from "@/app/lib/server-session"
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
      message: "You must be signed in to manage offers.",
    }
  }

  // better-auth types don't include the custom `role` field.
  const role = (session.user as { role?: string }).role
  if (role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "Admin access is required to manage offers.",
    }
  }

  return { ok: true }
}

type OffersApiResponse = {
  ok: boolean
  status: number
  data: Record<string, unknown>
}


export async function callOffersApi(
  path: string,
  init: { method: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown }
): Promise<OffersApiResponse> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) {
    console.error("INTERNAL_API_SECRET is not configured.")
    return {
      ok: false,
      status: 500,
      data: { message: "Offers are not configured on the server." },
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
      data: { message: "Could not reach the offers service. Try again later." },
    }
  }

  let data: Record<string, unknown> | null = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "The offers request failed. Please try again."
    return {
      ok: false,
      status: response.status >= 500 ? 502 : response.status,
      data: { message },
    }
  }

  return { ok: true, status: response.status, data: data ?? {} }
}
