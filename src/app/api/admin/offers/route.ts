import {
  sanitizeOfferForm,
  validateOfferForm,
} from "@/lib/offers"
import { callOffersApi, requireAdmin } from "./shared"

/**
 * Admin Offers API (admin only — enforced server-side):
 *
 * - GET  /api/admin/offers      → list every offer (active/inactive/expired)
 * - POST /api/admin/offers      → create an offer
 *
 * Both handlers verify the better-auth session AND the admin role before
 * touching Express, which additionally requires INTERNAL_API_SECRET.
 */

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status })
  }

  // Express has no /offers/all — GET /offers already returns every offer
  // (active and inactive alike), so ask for that instead of a 404.
  const result = await callOffersApi("/offers", { method: "GET" })
  if (!result.ok) {
    return Response.json(result.data, { status: result.status })
  }

  return Response.json(result.data, { status: 200 })
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status })
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

  const values = sanitizeOfferForm(body as Record<string, string>)
  const errors = validateOfferForm(values)
  const errorMessages = Object.values(errors)

  if (errorMessages.length > 0) {
    return Response.json(
      { message: errorMessages.join(" "), errors },
      { status: 400 }
    )
  }

  const result = await callOffersApi("/offers", {
    method: "POST",
    body: values,
  })

  if (!result.ok) {
    return Response.json(result.data, { status: result.status })
  }

  return Response.json(result.data, { status: 201 })
}
