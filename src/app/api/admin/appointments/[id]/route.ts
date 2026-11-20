import { callAppointmentsApi, requireAdmin } from "../shared"

type Params = { params: Promise<{ id: string }> }

const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status })
  }

  const { id } = await params
  if (!id) {
    return Response.json(
      { message: "Appointment id is required." },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 })
  }

  if (typeof body !== "object" || body === null || !("status" in body)) {
    return Response.json(
      { message: "Choose a valid appointment status." },
      { status: 400 }
    )
  }

  const patch = body as Record<string, unknown>
  if (
    typeof patch.status !== "string" ||
    !APPOINTMENT_STATUSES.some((status) => status === patch.status)
  ) {
    return Response.json(
      { message: "Choose a valid appointment status." },
      { status: 400 }
    )
  }

  if (patch.status === "completed" && patch.confirmedServiceProvided !== true) {
    return Response.json(
      {
        message:
          "Confirm that the service was provided before completing the appointment.",
      },
      { status: 400 }
    )
  }

  const result = await callAppointmentsApi(
    `/appointments/${encodeURIComponent(id)}`,
    { method: "PATCH", body: { status: patch.status } }
  )

  if (!result.ok) {
    return Response.json(result.data, { status: result.status })
  }

  return Response.json(result.data, { status: 200 })
}
