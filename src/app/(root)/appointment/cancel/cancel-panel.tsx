"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CalendarX2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react"

import { API_BASE_URL } from "@/app/lib/api/config"
import { authClient } from "@/app/lib/auth-client"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type AppointmentSnapshot = {
  _id: string
  userId?: string
  serviceName?: string
  date?: string
  time?: string
  status?: string
  paymentStatus?: string
  paidAt?: string | null
  cancelledAt?: string | null
  refundStatus?: string
}

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  confirmed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled:
    "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  completed:
    "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <Badge
      className={`${STATUS_STYLES[key] ?? "bg-muted text-muted-foreground"} gap-1.5 border-transparent`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {capitalize(status)}
    </Badge>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const paid = status.toLowerCase() === "paid"
  return (
    <Badge
      className={
        paid
          ? "gap-1.5 border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "gap-1.5 border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      }
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {paid ? "Paid" : "Unpaid"}
    </Badge>
  )
}

export default function CancelPanel({
  appointmentId,
}: {
  appointmentId: string
}) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const userId = session?.user?.id

  const [appointment, setAppointment] = useState<AppointmentSnapshot | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(appointmentId))
  const [reloadKey, setReloadKey] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [startingCheckout, setStartingCheckout] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (!appointmentId) return

    let active = true

    const load = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}`,
          { cache: "no-store" }
        )
        const data: unknown = await response.json().catch(() => null)
        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof (data as { message?: unknown }).message === "string"
              ? (data as { message: string }).message
              : "Could not load this booking."
          throw new Error(message)
        }
        if (!active) return
        setAppointment(data as AppointmentSnapshot)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(
          err instanceof Error ? err.message : "Could not load this booking."
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [appointmentId, reloadKey])

  // Never changes anything by itself: this page only reads the live
  // backend state. Cancellation happens solely through the explicit,
  // confirmed action below, which the backend re-verifies.
  const handleCancel = async () => {
    if (!appointment || !userId) return
    if ((appointment.status ?? "").toLowerCase() !== "pending") {
      setConfirmCancel(false)
      setActionError("Only pending appointments can be cancelled.")
      return
    }
    setActionError(null)
    const cancelToastId = "cancel-appointment"
    try {
      setCancelling(true)
      toast.add({
        id: cancelToastId,
        type: "loading",
        title: "Cancelling appointment…",
        description: "Please wait while we cancel this booking.",
      })
      const response = await fetch(
        `${API_BASE_URL}/bookings/${encodeURIComponent(appointment._id)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      )
      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Could not cancel this appointment."
        throw new Error(message)
      }
      const payload = data as { appointment?: AppointmentSnapshot }
      if (payload.appointment) setAppointment(payload.appointment)
      setError(null)
      toast.add({
        id: cancelToastId,
        type: "success",
        title: "Appointment cancelled",
        description: "Your booking has been cancelled successfully.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not cancel this appointment."
      setActionError(message)
      toast.add({
        id: cancelToastId,
        type: "error",
        title: "Cancellation failed",
        description: message,
      })
    } finally {
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  const handleCompletePayment = async () => {
    if (!appointment) return
    if (
      (appointment.status ?? "").toLowerCase() !== "confirmed" ||
      (appointment.paymentStatus ?? "").toLowerCase() === "paid"
    ) {
      setActionError(
        "Only unpaid confirmed appointments can be paid."
      )
      return
    }
    setActionError(null)
    const payToastId = "pay-appointment"
    try {
      setStartingCheckout(true)
      toast.add({
        id: payToastId,
        type: "loading",
        title: "Starting secure checkout…",
        description: "We are preparing Stripe payment for this booking.",
      })
      const response = await fetch(
        `${API_BASE_URL}/bookings/${encodeURIComponent(appointment._id)}/checkout`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      )
      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Could not start the checkout."
        throw new Error(message)
      }
      const payload = data as {
        data?: { redirectUrl?: string }
        redirectUrl?: string
      }
      const redirectUrl = payload.data?.redirectUrl ?? payload.redirectUrl
      if (!redirectUrl) {
        throw new Error("Stripe checkout URL was not returned by the server.")
      }
      toast.add({
        id: payToastId,
        type: "success",
        title: "Checkout ready",
        description: "Taking you to Stripe to complete your payment.",
      })
      window.location.assign(redirectUrl)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start the checkout."
      setActionError(message)
      setStartingCheckout(false)
      toast.add({
        id: payToastId,
        type: "error",
        title: "Checkout could not start",
        description: message,
      })
    }
  }

  if (!appointmentId) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Checkout cancelled</CardTitle>
          <CardDescription>
            No booking reference was included in this redirect.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Nothing was changed. Open My Appointments to see the live status
            of your bookings.
          </p>
          <Link href="/dashboard/my-appointments">
            <Button className="bg-[#b0764a] text-white hover:bg-[#9a643f]">
              View my appointments
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    )
  }

  const bookingStatus = (appointment?.status ?? "pending").toLowerCase()
  const paymentStatus = (appointment?.paymentStatus ?? "unpaid").toLowerCase()
  const isPaid = paymentStatus === "paid"
  const isCancelled = bookingStatus === "cancelled"
  const isCompleted = bookingStatus === "completed"
  const canCancel = bookingStatus === "pending"
  const canPay =
    bookingStatus === "confirmed" && !isPaid && Boolean(appointment)

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              isCancelled
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : canPay
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {isCancelled ? (
              <CalendarX2 className="size-5" />
            ) : canPay ? (
              <Clock3 className="size-5" />
            ) : (
              <CheckCircle2 className="size-5" />
            )}
          </span>
          <div>
            <CardTitle>
              {isCancelled
                ? "This booking is cancelled"
                : isCompleted
                  ? "This booking is completed"
                  : canPay
                    ? "Checkout not completed"
                    : "Your booking is confirmed"}
            </CardTitle>
            <CardDescription>
              {isCancelled
                ? "The status below comes straight from our records."
                : canPay
                  ? "Your payment was not completed, so nothing has been charged and nothing was cancelled automatically."
                  : "Stripe verified your payment and our records are updated."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true)
                setReloadKey((key) => key + 1)
              }}
            >
              <RefreshCw /> Retry
            </Button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{actionError}</span>
          </div>
        )}

        {appointment && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">{appointment.serviceName ?? "Booking"}</p>
            <p className="mt-1 text-muted-foreground">
              {formatDate(appointment.date)}
              {appointment.time ? ` · ${appointment.time}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={bookingStatus} />
              <PaymentBadge status={paymentStatus} />
            </div>
            {isCancelled && appointment.cancelledAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Cancelled at: {formatDateTime(appointment.cancelledAt)}
              </p>
            )}
            {isPaid && appointment.paidAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Paid at: {formatDateTime(appointment.paidAt)}
              </p>
            )}
          </div>
        )}

        {canPay && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            This booking is still awaiting payment, so it stays exactly as it
            is — visiting this page never cancels or changes it. You can
            complete the payment or explicitly cancel below.
          </p>
        )}

        {isPaid && canCancel && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Your payment is confirmed. This page will never cancel or
            downgrade it; cancelling keeps the payment record intact and any
            refund is handled separately.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {canPay && (
            <Button
              className="bg-[#b0764a] text-white hover:bg-[#9a643f]"
              disabled={startingCheckout}
              onClick={handleCompletePayment}
            >
              {startingCheckout ? (
                <>
                  <Loader2 className="animate-spin" /> Starting checkout…
                </>
              ) : (
                <>
                  <CreditCard /> Complete payment
                </>
              )}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              disabled={cancelling || sessionPending || !userId}
              onClick={() => setConfirmCancel(true)}
            >
              Cancel appointment
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setLoading(true)
              setReloadKey((key) => key + 1)
            }}
          >
            <RefreshCw /> Refresh status
          </Button>
        </div>

        {canCancel && !sessionPending && !userId && (
          <p className="text-sm text-muted-foreground">
            <Link href="/signin" className="underline">
              Sign in
            </Link>{" "}
            to cancel this appointment.
          </p>
        )}

        <Link
          href="/dashboard/my-appointments"
          className="text-sm text-muted-foreground underline"
        >
          Manage all your appointments
        </Link>
      </CardContent>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {appointment
                ? `${appointment.serviceName ?? "This booking"} on ${formatDate(appointment.date)} at${appointment.time ? ` ${appointment.time}` : ""} will be cancelled.${
                    isPaid
                      ? " Your payment record stays as paid — refunds are handled separately."
                      : ""
                  } This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep Appointment
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault()
                void handleCancel()
              }}
            >
              {cancelling ? (
                <>
                  <Loader2 className="animate-spin" /> Cancelling…
                </>
              ) : (
                "Yes, Cancel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
