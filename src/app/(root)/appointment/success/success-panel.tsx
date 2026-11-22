"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock3, RefreshCw } from "lucide-react"

import { API_BASE_URL } from "@/app/lib/api/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  serviceName?: string
  date?: string
  time?: string
  status?: string
  paymentStatus?: string
  paidAt?: string | null
  cancelledAt?: string | null
  refundStatus?: string
}

// The Stripe webhook can land slightly after the browser redirect, so the
// panel polls the backend a few times before settling on the live state.
const MAX_AUTO_CHECKS = 6
const CHECK_DELAY_MS = 2000

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

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
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
  const key = status.toLowerCase()
  const paid = key === "paid"
  return (
    <Badge
      className={`${PAYMENT_STYLES[key] ?? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"} gap-1.5 border-transparent`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {paid ? "Paid" : capitalize(status || "unpaid")}
    </Badge>
  )
}

export default function SuccessPanel({
  appointmentId,
}: {
  appointmentId: string
}) {
  const [appointment, setAppointment] = useState<AppointmentSnapshot | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(appointmentId))
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!appointmentId) return

    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const check = async () => {
      attempts += 1
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
              : "Could not verify the payment status."
          throw new Error(message)
        }
        if (cancelled) return
        const snapshot = data as AppointmentSnapshot
        setAppointment(snapshot)
        setError(null)

        // Stop polling as soon as the verified webhook has marked the
        // booking as paid — no further guessing needed.
        if ((snapshot.paymentStatus ?? "").toLowerCase() === "paid") {
          return
        }
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error
            ? err.message
            : "Could not verify the payment status."
        )
      } finally {
        if (!cancelled) setLoading(false)
      }

      if (!cancelled && attempts < MAX_AUTO_CHECKS) {
        timer = setTimeout(check, CHECK_DELAY_MS)
      }
    }

    void check()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [appointmentId, reloadKey])

  if (!appointmentId) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Thank you for your payment</CardTitle>
          <CardDescription>
            No booking reference was included in this redirect.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Open My Appointments to see the live status of your bookings —
            it is always read straight from our records.
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

  const paymentStatus = (appointment?.paymentStatus ?? "unpaid").toLowerCase()
  const bookingStatus = (appointment?.status ?? "pending").toLowerCase()
  const isPaid = paymentStatus === "paid"
  const isConfirmed = bookingStatus === "confirmed"

  const title = isPaid
    ? isConfirmed
      ? "Payment confirmed"
      : "Payment received"
    : "Payment not confirmed yet"

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              isPaid
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Clock3 className="size-5" />
            )}
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {isPaid
                ? "Stripe verified your payment and our records are updated."
                : "This page shows the live status from our records — nothing is marked as paid before Stripe verifies it."}
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

        {appointment && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">{appointment.serviceName ?? "Booking"}</p>
            <p className="mt-1 text-muted-foreground">
              {formatDate(appointment.date)}
              {appointment.time ? ` · ${appointment.time}` : ""}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Booking status</span>
          <StatusBadge status={bookingStatus} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Payment status</span>
          <PaymentBadge status={paymentStatus} />
        </div>

        {isPaid && appointment?.paidAt && (
          <p className="text-sm text-muted-foreground">
            Paid at: {formatDateTime(appointment.paidAt)}
          </p>
        )}

        {!isPaid && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Your payment has not been confirmed yet. The status updates
            automatically once Stripe verifies the payment — a redirect back
            to this page alone never changes it.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true)
              setReloadKey((key) => key + 1)
            }}
          >
            <RefreshCw /> Refresh status
          </Button>
          <Link href="/dashboard/my-appointments">
            <Button className="bg-[#b0764a] text-white hover:bg-[#9a643f]">
              View my appointments
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
