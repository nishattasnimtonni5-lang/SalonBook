import CancelPanel from "./cancel-panel"

// searchParams is a Promise in this Next.js version, so the page awaits it
// on the server and passes the plain value down. The panel only ever shows
// the real backend state — landing on this page never changes anything.
export default async function CancelPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string | string[] }>
}) {
  const { appointmentId } = await searchParams
  const id = typeof appointmentId === "string" ? appointmentId : ""

  return <CancelPanel appointmentId={id} />
}
