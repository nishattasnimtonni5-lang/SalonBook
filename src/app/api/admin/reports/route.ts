import { callReportsApi, requireAdmin } from "./shared"

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status })
  }

  const result = await callReportsApi("/reports", { method: "GET" })
  if (!result.ok) {
    return Response.json(result.data, { status: result.status })
  }

  return Response.json(result.data, { status: 200 })
}
