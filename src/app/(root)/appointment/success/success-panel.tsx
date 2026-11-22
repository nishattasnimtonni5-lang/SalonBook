"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  FileText,
  Mail,
  RefreshCw,
  Scissors,
  Sparkles,
  User,
} from "lucide-react"

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
  serviceId?: string
  serviceName?: string
  serviceImage?: string
  date?: string
  time?: string
  price?: number
  duration?: string
  status?: string
  paymentStatus?: string
  paidAt?: string | null
  cancelledAt?: string | null
  stripeSessionId?: string | null
  customerName?: string
  customerEmail?: string
}

type TransactionRecord = {
  _id?: string
  appointmentId: string
  customerName?: string
  customerEmail?: string
  serviceName?: string
  serviceImage?: string
  appointmentDate?: string
  appointmentTime?: string
  paymentAmount: number
  currency: string
  stripeSessionId: string
  paymentStatus: string
  transactionDate: string
}

const MAX_AUTO_CHECKS = 6
const CHECK_DELAY_MS = 2000

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

export default function SuccessPanel({
  appointmentId,
  sessionId,
}: {
  appointmentId?: string
  sessionId?: string
}) {
  const [appointment, setAppointment] = useState<AppointmentSnapshot | null>(
    null
  )
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(appointmentId || sessionId))
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!appointmentId && !sessionId) return

    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const check = async () => {
      attempts += 1
      try {
        // First try to verify session and retrieve / save transaction
        const verifyParams = new URLSearchParams()
        if (sessionId) verifyParams.set("session_id", sessionId)
        if (appointmentId) verifyParams.set("appointmentId", appointmentId)

        const verifyRes = await fetch(
          `${API_BASE_URL}/bookings/verify-session?${verifyParams.toString()}`,
          { cache: "no-store" }
        ).catch(() => null)

        if (verifyRes?.ok) {
          const verifyData = await verifyRes.json()
          if (!cancelled && verifyData.success) {
            if (verifyData.appointment) {
              setAppointment(verifyData.appointment)
            }
            if (verifyData.transaction) {
              setTransaction(verifyData.transaction)
            }
            setError(null)
            if (verifyData.verified) {
              return
            }
          }
        }

        // Fallback: fetch appointment directly if appointmentId is known
        const targetId = appointmentId || appointment?._id
        if (targetId) {
          const response = await fetch(
            `${API_BASE_URL}/appointments/${encodeURIComponent(targetId)}`,
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

          if ((snapshot.paymentStatus ?? "").toLowerCase() === "paid") {
            // Also try fetching saved transaction
            const txRes = await fetch(
              `${API_BASE_URL}/transactions/${encodeURIComponent(targetId)}`,
              { cache: "no-store" }
            ).catch(() => null)
            if (txRes?.ok) {
              const txData = await txRes.json()
              if (!cancelled && txData) setTransaction(txData)
            }
            return
          }
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
  }, [appointmentId, sessionId, reloadKey, appointment?._id])

  if (!appointmentId && !sessionId) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle>Thank you for your visit</CardTitle>
          <CardDescription>
            No booking reference was included in this redirect.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Open My Appointments to see the live status of your bookings.
          </p>
          <Link href="/dashboard/my-appointments">
            <Button className="bg-rose-600 text-white hover:bg-rose-700">
              View my appointments
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  const paymentStatus = (
    transaction?.paymentStatus ??
    appointment?.paymentStatus ??
    "unpaid"
  ).toLowerCase()
  const isPaid = paymentStatus === "paid"

  const customerName =
    transaction?.customerName || appointment?.customerName || "Customer"
  const customerEmail =
    transaction?.customerEmail || appointment?.customerEmail || "—"
  const serviceName =
    transaction?.serviceName || appointment?.serviceName || "Salon Service"
  const serviceImage = transaction?.serviceImage || appointment?.serviceImage
  const appointmentDate =
    transaction?.appointmentDate || appointment?.date || ""
  const appointmentTime =
    transaction?.appointmentTime || appointment?.time || ""
  const paymentAmount =
    transaction?.paymentAmount ?? appointment?.price ?? 0
  const currency = transaction?.currency || "USD"
  const stripeSessionId =
    transaction?.stripeSessionId ||
    appointment?.stripeSessionId ||
    sessionId ||
    "—"
  const transactionDate =
    transaction?.transactionDate ||
    appointment?.paidAt ||
    new Date().toISOString()

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {/* ============ Confirmation Header ============ */}
      <Card className="overflow-hidden border-rose-100 shadow-md dark:border-zinc-800">
        <CardHeader className="bg-gradient-to-r from-rose-50/70 via-pink-50/40 to-transparent dark:from-rose-950/20 dark:via-zinc-900 dark:to-transparent">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                isPaid
                  ? "bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="size-7" />
              ) : (
                <Clock3 className="size-7" />
              )}
            </span>
            <div>
              <CardTitle className="text-xl font-semibold sm:text-2xl">
                {isPaid ? "Payment Confirmed! 🎉" : "Payment Verification Pending"}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {isPaid
                  ? "Your payment was verified and your appointment has been confirmed."
                  : "We are verifying your transaction with Stripe. Please wait a moment."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
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
                <RefreshCw className="size-3.5" /> Retry
              </Button>
            </div>
          )}

          {/* ============ Transactions Details Card ============ */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-4 flex items-center justify-between border-b pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-rose-600" />
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Transaction Receipt
                </h3>
              </div>
              <Badge
                className={
                  isPaid
                    ? "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }
              >
                ● {capitalize(paymentStatus)}
              </Badge>
            </div>

            <dl className="grid grid-cols-1 gap-y-3.5 text-sm sm:grid-cols-2 sm:gap-x-4">
              {/* Customer Information */}
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                  <User className="size-3.5 text-zinc-400" />
                  Customer Information
                </dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {customerName}
                  {customerEmail && (
                    <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {customerEmail}
                    </span>
                  )}
                </dd>
              </div>

              {/* Related Service */}
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                  <Scissors className="size-3.5 text-zinc-400" />
                  Related Service
                </dt>
                <dd className="mt-1 flex items-center gap-3">
                  {serviceImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={serviceImage}
                      alt={serviceName}
                      className="size-9 rounded-md object-cover ring-1 ring-black/10"
                    />
                  )}
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {serviceName}
                    </span>
                    {appointment?.duration && (
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        Duration: {appointment.duration}
                      </span>
                    )}
                  </div>
                </dd>
              </div>

              {/* Appointment Date */}
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                  <Calendar className="size-3.5 text-zinc-400" />
                  Appointment Date
                </dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDate(appointmentDate)}
                  {appointmentTime && (
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      Time: {appointmentTime}
                    </span>
                  )}
                </dd>
              </div>

              {/* Payment Amount & Currency */}
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                  <DollarSign className="size-3.5 text-zinc-400" />
                  Payment Amount
                </dt>
                <dd className="mt-1 text-base font-semibold text-rose-600 dark:text-rose-400">
                  ${Number(paymentAmount).toFixed(2)}{" "}
                  <span className="text-xs font-normal text-zinc-500 uppercase dark:text-zinc-400">
                    ({currency})
                  </span>
                </dd>
              </div>

              {/* Stripe Checkout Session ID */}
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                  <CreditCard className="size-3.5 text-zinc-400" />
                  Stripe Checkout Session ID
                </dt>
                <dd className="mt-1 font-mono text-xs text-zinc-700 break-all dark:text-zinc-300">
                  {stripeSessionId}
                </dd>
              </div>

              {/* Transaction Date */}
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                  <Clock3 className="size-3.5 text-zinc-400" />
                  Transaction Date
                </dt>
                <dd className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {formatDateTime(transactionDate)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link href="/dashboard/my-appointments">
              <Button className="bg-rose-600 text-white shadow-sm hover:bg-rose-700">
                View My Appointments
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  setReloadKey((k) => k + 1)
                }}
              >
                <RefreshCw className="mr-1.5 size-3.5" /> Refresh
              </Button>
              <Link href="/services">
                <Button variant="ghost" size="sm">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
