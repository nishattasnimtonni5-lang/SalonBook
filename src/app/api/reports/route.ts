import {
  sanitizeReportForm,
  validateReportForm,
} from "@/lib/reports"
import { getRequestSession } from "@/app/lib/server-session"
import { REPORTS_API_URL } from "@/app/lib/api/server-config"

/**
 * Server-side endpoint for submitting a "Report an Issue" form.
 *
 * - Verifies the better-auth session (customer identity is NEVER taken from
 *   the request body, only from the verified session).
 * - Validates the report fields.
 * - Forwards the report to the Express API, which stores it in MongoDB and
 *   emails the admin. The shared INTERNAL_API_SECRET proves the call comes
 *   from this server, so the Express endpoint cannot be abused directly.
 */

type ForwardResult = {
  ok: boolean
  status: number
  message: string
}

async function forwardToReportsApi(
  payload: Record<string, unknown>
): Promise<ForwardResult> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) {
    console.error("INTERNAL_API_SECRET is not configured.")
    return {
      ok: false,
      status: 500,
      message: "Report submission is not configured on the server.",
    }
  }

  let response: Response
  try {
    response = await fetch(REPORTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Could not reach the report service. Please try again later.",
    }
  }

  let data: { message?: string } | null = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status >= 500 ? 502 : response.status,
      message:
        data?.message ??
        "Your report could not be submitted. Please try again later.",
    }
  }

  return { ok: true, status: 200, message: "Report submitted." }
}

export async function POST(request: Request) {
  const session = await getRequestSession()

  if (!session?.user) {
    return Response.json(
      { message: "You must be signed in to report an issue." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ message: "Invalid request body." }, { status: 400 })
  }

  const values = sanitizeReportForm(body as Record<string, string>)
  const errors = validateReportForm(values)
  const errorMessages = Object.values(errors)

  if (errorMessages.length > 0) {
    return Response.json(
      { message: errorMessages.join(" "), errors },
      { status: 400 }
    )
  }

  const result = await forwardToReportsApi({
    userId: session.user.id,
    customerName: session.user.name,
    customerEmail: session.user.email,
    category: values.category,
    subject: values.subject,
    relatedService: values.relatedService,
    appointmentId: values.appointmentId,
    description: values.description,
  })

  if (!result.ok) {
    return Response.json({ message: result.message }, { status: result.status })
  }

  return Response.json({ message: result.message }, { status: 200 })
}
