import SuccessPanel from "@/app/(root)/appointment/success/success-panel";

export default async function CheckoutSuccessPage({
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-12">
      <SuccessPanel appointmentId={id} sessionId={sessionId} />
    </div>
  );
}