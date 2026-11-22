import SuccessPanel from "./success-panel"

// searchParams is a Promise in this Next.js version, so the page awaits it
// on the server and passes the plain value down — no client-side guessing
// about payment state; the panel always verifies against the backend.
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    appointmentId?: string | string[];
    session_id?: string | string[];
  }>;
}) {
  const { appointmentId, session_id } = await searchParams;
  const id = typeof appointmentId === "string" ? appointmentId : "";
  const sessionId = typeof session_id === "string" ? session_id : "";

  return <SuccessPanel appointmentId={id} sessionId={sessionId} />;
}
