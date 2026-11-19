import {
  sanitizeOfferForm,
  validateOfferForm,
} from "@/lib/offers"
import { callOffersApi, requireAdmin } from "../shared"

/**
 * Admin Offers API for a single offer (admin only — enforced server-side):
 *
 * - PATCH  /api/admin/offers/[id] → update fields and/or activate/deactivate
 * - DELETE /api/admin/offers/[id] → delete the offer
 *
 * A PATCH that only flips `active` skips the full-form validation (there
 * is nothing else to validate); any other PATCH must pass the complete
 * offer validation before it is forwarded to Express, which re-validates
 * the merged document as well.
 */

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status })
  }

  const { id } = await params
  if (!id || typeof id !== "string") {
    return Response.json({ message: "Offer id is required." }, { status: 400 })
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

  const patch = body as Record<string, unknown>
  const keys = Object.keys(patch)

  if (keys.length === 0) {
    return Response.json({ message: "Nothing to update." }, { status: 400 })
  }

  // Toggle-only update: { active: true|false }.
  if (keys.length === 1 && keys[0] === "active") {
    if (typeof patch.active !== "boolean") {
      return Response.json(
        { message: "Active must be true or false." },
        { status: 400 }
      )
    }

    const result = await callOffersApi(`/offers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { active: patch.active },
    })

    if (!result.ok) {
      return Response.json(result.data, { status: result.status })
    }
    return Response.json(result.data, { status: 200 })
  }

  // Full-form update: validate everything server-side first.
  const values = sanitizeOfferForm(patch as Record<string, string>)
  const errors = validateOfferForm(values)
  const errorMessages = Object.values(errors)

  if (errorMessages.length > 0) {
    return Response.json(
      { message: errorMessages.join(" "), errors },
      { status: 400 }
    )
  }

  const payload: Record<string, unknown> = { ...values }
  if (typeof patch.active === "boolean") {
    payload.active = patch.active
  }

  const result = await callOffersApi(`/offers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  })

  if (!result.ok) {
    return Response.json(result.data, { status: result.status })
  }
  return Response.json(result.data, { status: 200 })
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status })
  }

  const { id } = await params
  if (!id || typeof id !== "string") {
    return Response.json({ message: "Offer id is required." }, { status: 400 })
  }

  const result = await callOffersApi(`/offers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })

  if (!result.ok) {
    return Response.json(result.data, { status: result.status })
  }
  return Response.json(result.data, { status: 200 })
}
