import { callReportsApi, requireAdmin } from "../shared"

type Params = { params: Promise<{ id: string }> }

const REPORT_STATUSES = ["pending", "reviewed", "resolved"] as const

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status })
  }

  const { id } = await params
  if (!id) {
    return Response.json({ message: "Report id is required." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 })
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    typeof body.status !== "string" ||
    !(REPORT_STATUSES as readonly string[]).includes(body.status)
  ) {
    return Response.json(
      { message: "Choose a valid report status." },
      { status: 400 }
    )
  }

  const result = await callReportsApi(
    `/reports/${encodeURIComponent(id)}`,
    { method: "PATCH", body: { status: body.status } }
  )

  if (!result.ok) {
    return Response.json(result.data, { status: result.status })
  }

  return Response.json(result.data, { status: 200 })
}
