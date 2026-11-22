"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarX2, CreditCard, Loader2, RefreshCw } from "lucide-react"

import { authClient } from "@/app/lib/auth-client"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const API_URL = "http://localhost:8000/appointments"
const BOOKINGS_URL = "http://localhost:8000/bookings"

type Appointment = {
  _id: string
  serviceId: string
  serviceName: string
  serviceImage: string
  price: number
  duration?: string
  date: string
  time: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  paymentStatus?: string
  userId?: string
  paidAt?: string | null
  cancelledAt?: string | null
  refundStatus?: string
  createdAt: string
}

const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
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

function formatDate(value: string) {
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

function formatPrice(price: number) {
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatRequestedDate(value: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatRequestedTime(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
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

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <Badge
      className={`${APPOINTMENT_STATUS_STYLES[key] ?? "bg-muted text-muted-foreground"} gap-1.5 border-transparent`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {capitalize(status)}
    </Badge>
  )
}

function PaymentBadge({ appointment }: { appointment: Appointment }) {
  const paid =
    (appointment.paymentStatus ?? "").toLowerCase() === "paid"
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

function isPaid(appointment: Appointment) {
  return (appointment.paymentStatus ?? "").toLowerCase() === "paid"
}

async function fetchAppointments(): Promise<Appointment[]> {
  const response = await fetch(API_URL, {
    credentials: "include",
    cache: "no-store",
  })
  if (!response.ok) throw new Error("Failed to fetch appointments")
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export default function MyAppointmentsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const userId = session?.user?.id

  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [pendingCancel, setPendingCancel] = useState<Appointment | null>(null)
  const [pendingPay, setPendingPay] = useState<Appointment | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [details, setDetails] = useState<Appointment | null>(null)

  // Only this customer's bookings are shown, and every value displayed
  // below comes straight from MongoDB via the backend.
  const loading =
    sessionPending || (!!userId && appointments === null && error === null)
  const list = appointments ?? []

  useEffect(() => {
    if (!userId) return
    let active = true
    fetchAppointments()
      .then((data) => {
        if (!active) return
        setAppointments(data.filter((item) => item.userId === userId))
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : "Something went wrong")
      })
    return () => {
      active = false
    }
  }, [userId])

  const reload = () => {
    if (!userId) return
    setAppointments(null)
    setError(null)
    fetchAppointments()
      .then((data) => {
        setAppointments(data.filter((item) => item.userId === userId))
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Something went wrong")
      })
  }

  const handleCancel = async () => {
    if (!pendingCancel || !userId) return
    const appointment = pendingCancel
    if (appointment.status.toLowerCase() !== "pending") {
      setPendingCancel(null)
      return
    }
    const cancelToastId = "cancel-appointment"
    try {
      setCancellingId(appointment._id)
      toast.add({
        id: cancelToastId,
        type: "loading",
        title: "Cancelling appointment…",
        description: "Please wait while we cancel this booking.",
      })
      // Backend-verified cancellation: the server checks the appointment
      // id, ownership and eligibility, and never touches paymentStatus.
      const response = await fetch(
        `${BOOKINGS_URL}/${appointment._id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId }),
        }
      )
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.message || "Failed to cancel appointment")
      }
      // Show the state the server actually stored.
      const updated: Appointment | undefined = data?.appointment
      const next: Appointment = updated ?? {
        ...appointment,
        status: "cancelled",
      }
      setAppointments((prev) =>
        prev?.map((item) => (item._id === appointment._id ? next : item)) ??
        prev
      )
      setDetails(null)
      toast.add({
        id: cancelToastId,
        type: "success",
        title: "Appointment cancelled",
        description: "Your booking has been cancelled successfully.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel appointment"
      setError(message)
      toast.add({
        id: cancelToastId,
        type: "error",
        title: "Cancellation failed",
        description:
          message ||
          "We could not cancel this appointment. Please try again.",
      })
    } finally {
      setCancellingId(null)
      setPendingCancel(null)
      setDetails(null)
    }
  }

  const canCancel = (status: string) =>
    status.toLowerCase() === "pending"

  const canPay = (appointment: Appointment) =>
    appointment.status.toLowerCase() === "confirmed" && !isPaid(appointment)

  const handlePay = async () => {
    if (!pendingPay) return
    const appointment = pendingPay
    if (
      appointment.status.toLowerCase() !== "confirmed" ||
      isPaid(appointment)
    ) {
      setPendingPay(null)
      return
    }
    const payToastId = "pay-appointment"
    let redirected = false
    try {
      setPayingId(appointment._id)
      toast.add({
        id: payToastId,
        type: "loading",
        title: "Starting secure checkout…",
        description: "We are preparing Stripe payment for this booking.",
      })
      // Real Stripe checkout for this appointment. The backend only
      // returns a redirect URL — paymentStatus becomes "paid" exclusively
      // through the verified Stripe webhook, never from this page.
      const response = await fetch(
        `${BOOKINGS_URL}/${appointment._id}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      )
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.message || "Failed to start checkout")
      }
      const redirectUrl = data?.data?.redirectUrl ?? data?.redirectUrl
      if (!redirectUrl) {
        throw new Error("Stripe checkout URL was not returned by the server.")
      }
      redirected = true
      toast.add({
        id: payToastId,
        type: "success",
        title: "Checkout ready",
        description: "Taking you to Stripe to complete your payment.",
      })
      window.location.assign(redirectUrl)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout"
      setError(message)
      toast.add({
        id: payToastId,
        type: "error",
        title: "Checkout could not start",
        description:
          message || "We could not start your payment. Please try again.",
      })
    } finally {
      if (!redirected) {
        setPayingId(null)
        setPendingPay(null)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My Appointments
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          View and manage your upcoming and past salon bookings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            {loading
              ? "Loading your bookings…"
              : `${list.length} ${list.length === 1 ? "booking" : "bookings"} found`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && !loading && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={reload}>
                <RefreshCw /> Retry
              </Button>
            </div>
          )}

          {!sessionPending && !userId ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarX2 />
                </EmptyMedia>
                <EmptyTitle>Sign in to view your appointments</EmptyTitle>
                <EmptyDescription>
                  Your bookings are linked to your account. Sign in to see and
                  manage them.
                </EmptyDescription>
              </EmptyHeader>
              <Link href="/signin">
                <Button className="mt-2 bg-[#b0764a] text-white hover:bg-[#9a643f]">
                  Sign in
                </Button>
              </Link>
            </Empty>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarX2 />
                </EmptyMedia>
                <EmptyTitle>No appointments yet</EmptyTitle>
                <EmptyDescription>
                  When you book a service, your appointments will show up here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>
                      <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
                        {appointment.serviceImage ? (
                          <Image
                            src={appointment.serviceImage}
                            alt={appointment.serviceName}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {appointment.serviceName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatDate(appointment.date)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {appointment.time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(appointment.price)}</TableCell>
                    <TableCell>
                      <StatusBadge status={appointment.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentBadge appointment={appointment} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatRequestedDate(appointment.createdAt)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRequestedTime(appointment.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setDetails(appointment)}
                        >
                          Details
                        </Button>
                        {canPay(appointment) && (
                            <Button
                              size="sm"
                              className="rounded-full bg-[#b0764a] text-white hover:bg-[#9a643f]"
                              disabled={payingId === appointment._id}
                              onClick={() => setPendingPay(appointment)}
                            >
                              {payingId === appointment._id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <CreditCard />
                              )}
                              Pay now
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent>
          {details && (
            <>
              <DialogHeader>
                <DialogTitle>{details.serviceName}</DialogTitle>
                <DialogDescription>
                  Appointment details and booking information.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-start gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {details.serviceImage ? (
                    <Image
                      src={details.serviceImage}
                      alt={details.serviceName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <dl className="grid flex-1 grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium">{formatDate(details.date)}</dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className="font-medium">{details.time}</dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="font-medium">
                      {formatPrice(details.price)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="font-medium">{details.duration ?? "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:block">
                    <dt className="text-muted-foreground">
                      Appointment status
                    </dt>
                    <dd className="sm:mt-1">
                      <StatusBadge status={details.status} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:block">
                    <dt className="text-muted-foreground">Payment Status</dt>
                    <dd className="sm:mt-1">
                      <PaymentBadge appointment={details} />
                    </dd>
                  </div>
                  {details.paidAt && (
                    <div className="flex items-center justify-between gap-2 sm:block">
                      <dt className="text-muted-foreground">Paid At</dt>
                      <dd className="font-medium">
                        {formatDateTime(details.paidAt)}
                      </dd>
                    </div>
                  )}
                  {details.cancelledAt && (
                    <div className="flex items-center justify-between gap-2 sm:block">
                      <dt className="text-muted-foreground">Cancelled At</dt>
                      <dd className="font-medium">
                        {formatDateTime(details.cancelledAt)}
                      </dd>
                    </div>
                  )}
                  <div className="col-span-full flex justify-between gap-2 sm:block">
                    <dt className="text-muted-foreground">Requested At</dt>
                    <dd className="font-medium">
                      {formatRequestedDate(details.createdAt)}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {formatRequestedTime(details.createdAt)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetails(null)}>
                  Close
                </Button>
                <Button
                  variant="destructive"
                  disabled={!canCancel(details.status)}
                  onClick={() => {
                    setPendingCancel(details)
                    setDetails(null)
                  }}
                >
                  Cancel Appointment
                </Button>
                {canPay(details) && (
                  <Button
                    className="bg-[#b0764a] text-white hover:bg-[#9a643f]"
                    disabled={payingId === details._id}
                    onClick={() => setPendingPay(details)}
                  >
                    {payingId === details._id ? (
                      <>
                        <Loader2 className="animate-spin" /> Processing…
                      </>
                    ) : (
                      <>
                        <CreditCard /> Pay now
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingCancel}
        onOpenChange={(open) => !open && setPendingCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCancel
                ? `${pendingCancel.serviceName} on ${formatDate(pendingCancel.date)} at ${pendingCancel.time} will be cancelled. This action cannot be undone.${
                    isPaid(pendingCancel)
                      ? " Your payment record stays as paid — any refund is handled separately."
                      : ""
                  }`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingId !== null}>
              Keep Appointment
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cancellingId !== null}
              onClick={(event) => {
                event.preventDefault()
                handleCancel()
              }}
            >
              {cancellingId !== null ? (
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

      <AlertDialog
        open={!!pendingPay}
        onOpenChange={(open) => !open && setPendingPay(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete your payment</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPay
                ? `Pay ${formatPrice(pendingPay.price)} for ${pendingPay.serviceName} on ${formatDate(pendingPay.date)} at ${pendingPay.time}?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={payingId !== null}>
              Not now
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={payingId !== null}
              className="bg-[#b0764a] text-white hover:bg-[#9a643f]"
              onClick={(event) => {
                event.preventDefault()
                handlePay()
              }}
            >
              {payingId !== null ? (
                <>
                  <Loader2 className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <CreditCard /> Pay {pendingPay ? formatPrice(pendingPay.price) : ""}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
