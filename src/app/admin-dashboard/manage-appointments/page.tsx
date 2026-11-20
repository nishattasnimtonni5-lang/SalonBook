"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Mail,
  RefreshCw,
  Search,
  Scissors,
  UserRound,
  XCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { authClient } from "@/app/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const APPOINTMENTS_API = "/api/admin/appointments"
const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"] as const

type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

type Appointment = {
  id: string
  userId: string
  customerName: string
  customerEmail: string
  serviceId: string
  serviceName: string
  price: string
  duration: string
  date: string
  time: string
  status: string
  createdAt: string
  paymentMethod: string
  paymentStatus: string
  transactionId: string
  paymentAmount: string
  notes: string
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function firstText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" || typeof value === "number") {
      return String(value)
    }
  }
  return ""
}

function normalizeAppointment(value: unknown): Appointment | null {
  const record = recordOf(value)
  if (!record) return null

  return {
    id: firstText(record, ["_id", "id", "appointmentId"]),
    userId: firstText(record, ["userId"]),
    customerName: firstText(record, ["customerName"]),
    customerEmail: firstText(record, ["customerEmail"]),
    serviceId: firstText(record, ["serviceId"]),
    serviceName: firstText(record, ["serviceName"]),
    price: firstText(record, ["price"]),
    duration: firstText(record, ["duration"]),
    date: firstText(record, ["date", "appointmentDate"]),
    time: firstText(record, ["time", "appointmentTime"]),
    status: firstText(record, ["status"]),
    createdAt: firstText(record, ["createdAt", "bookingDate"]),
    paymentMethod: firstText(record, ["paymentMethod"]),
    paymentStatus: firstText(record, ["paymentStatus"]) || "unpaid",
    transactionId: firstText(record, [
      "transactionId",
      "transactionID",
      "transaction_id",
    ]),
    paymentAmount: firstText(record, [
      "paymentAmount",
      "amountPaid",
      "amount",
    ]),
    notes: firstText(record, ["notes", "bookingNotes", "customerNotes"]),
  }
}

function isAppointmentStatus(value: string | null): value is AppointmentStatus {
  return (
    value !== null &&
    APPOINTMENT_STATUSES.some((status) => status === value)
  )
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase()
}

function formatLabel(value: string) {
  if (!value) return "Not recorded"
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date)
}

function formatBookingDate(value: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatPrice(value: string) {
  const amount = Number(value)
  if (!value || !Number.isFinite(amount)) return "—"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function scheduledAt(appointment: Appointment) {
  const dateParts = appointment.date.slice(0, 10).split("-").map(Number)
  const timeMatch = appointment.time.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
  )
  if (
    dateParts.length !== 3 ||
    dateParts.some((part) => !Number.isFinite(part)) ||
    !timeMatch
  ) {
    return null
  }

  let hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])
  const meridiem = timeMatch[3]?.toUpperCase()
  if (minutes > 59 || hours > 23) return null
  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (meridiem === "PM" ? 12 : 0)
  }

  const [year, month, day] = dateParts
  const date = new Date(year, month - 1, day, hours, minutes)
  return Number.isNaN(date.getTime()) ? null : date
}

function canComplete(appointment: Appointment) {
  const start = scheduledAt(appointment)
  return start !== null && start.getTime() <= Date.now()
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const key = normalizeStatus(status)
  const className =
    key === "pending"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : key === "confirmed"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        : key === "completed"
          ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
          : key === "cancelled"
            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
            : "bg-muted text-muted-foreground"

  return (
    <Badge className={`${className} gap-1.5 border-transparent`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {formatLabel(status || "Unknown")}
    </Badge>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const key = normalizeStatus(status)
  const className =
    key === "paid"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : key === "failed"
        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
        : key === "refunded"
          ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
          : key === "pending"
            ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"

  return (
    <Badge className={`${className} gap-1.5 border-transparent`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {formatLabel(status || "unpaid")}
    </Badge>
  )
}

function StatusSelect({
  appointment,
  disabled,
  onChange,
}: {
  appointment: Appointment
  disabled: boolean
  onChange: (appointment: Appointment, status: AppointmentStatus) => void
}) {
  const currentStatus = normalizeStatus(appointment.status)

  return (
    <Select
      value={isAppointmentStatus(currentStatus) ? currentStatus : ""}
      onValueChange={(value) => {
        if (isAppointmentStatus(value) && value !== currentStatus) {
          onChange(appointment, value)
        }
      }}
      disabled={disabled || !appointment.id}
    >
      <SelectTrigger
        aria-label={`Update status for appointment ${appointment.id}`}
        className="w-full min-w-36"
      >
        <SelectValue placeholder="Set status" />
      </SelectTrigger>
      <SelectContent>
        {APPOINTMENT_STATUSES.map((status) => (
          <SelectItem
            key={status}
            value={status}
            disabled={status === "completed" && !canComplete(appointment)}
          >
            {formatLabel(status)}
            {status === "completed" && !canComplete(appointment)
              ? " · after appointment time"
              : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: number
  icon: LucideIcon
  accent: string
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex-row items-center justify-between gap-3 px-4 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className={`rounded-lg p-2 ${accent}`}>
          <Icon className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-words text-sm">{value}</p>
      </div>
    </div>
  )
}

export default function ManageAppointmentsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const isAdmin = role === "admin"

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [details, setDetails] = useState<Appointment | null>(null)
  const [pendingCompletion, setPendingCompletion] =
    useState<Appointment | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [completionError, setCompletionError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    const response = await fetch(APPOINTMENTS_API, { cache: "no-store" })
    const data: unknown = await response.json()

    if (!response.ok) {
      const payload = recordOf(data)
      throw new Error(
        typeof payload?.message === "string"
          ? payload.message
          : "Appointments could not be loaded."
      )
    }

    const payload = recordOf(data)
    const items = Array.isArray(data)
      ? data
      : Array.isArray(payload?.appointments)
        ? payload.appointments
        : null

    if (!items) {
      throw new Error("The appointments service returned an unexpected response.")
    }

    return items
      .map(normalizeAppointment)
      .filter((appointment): appointment is Appointment => appointment !== null)
  }, [])

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAppointments(await fetchAppointments())
    } catch (err) {
      setAppointments([])
      setError(
        err instanceof Error
          ? err.message
          : "Appointments could not be loaded. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }, [fetchAppointments])

  useEffect(() => {
    if (sessionPending || !isAdmin) return

    let active = true
    fetchAppointments()
      .then((data) => {
        if (!active) return
        setAppointments(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setAppointments([])
        setError(
          err instanceof Error
            ? err.message
            : "Appointments could not be loaded. Please try again."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [sessionPending, isAdmin, fetchAppointments])

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return appointments.filter((appointment) => {
      const matchesSearch =
        !query ||
        [
          appointment.customerName,
          appointment.customerEmail,
          appointment.id,
        ].some((value) => value.toLowerCase().includes(query))
      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(appointment.status) === statusFilter
      const matchesPayment =
        paymentFilter === "all" ||
        normalizeStatus(appointment.paymentStatus) === paymentFilter
      const matchesDate =
        !dateFilter || appointment.date.slice(0, 10) === dateFilter
      return matchesSearch && matchesStatus && matchesPayment && matchesDate
    })
  }, [appointments, search, statusFilter, paymentFilter, dateFilter])

  const summary = useMemo(
    () => ({
      total: appointments.length,
      pending: appointments.filter(
        (appointment) => normalizeStatus(appointment.status) === "pending"
      ).length,
      confirmed: appointments.filter(
        (appointment) => normalizeStatus(appointment.status) === "confirmed"
      ).length,
      completed: appointments.filter(
        (appointment) => normalizeStatus(appointment.status) === "completed"
      ).length,
      cancelled: appointments.filter(
        (appointment) => normalizeStatus(appointment.status) === "cancelled"
      ).length,
    }),
    [appointments]
  )

  const updateStatus = async (
    appointment: Appointment,
    status: AppointmentStatus,
    confirmedServiceProvided = false
  ) => {
    setUpdatingId(appointment.id)
    setError(null)
    setCompletionError(null)
    try {
      const response = await fetch(
        `${APPOINTMENTS_API}/${encodeURIComponent(appointment.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            ...(status === "completed" ? { confirmedServiceProvided } : {}),
          }),
        }
      )
      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const payload = recordOf(data)
        throw new Error(
          typeof payload?.message === "string"
            ? payload.message
            : "The appointment status could not be updated."
        )
      }

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? { ...item, status } : item
        )
      )
      setDetails((current) =>
        current?.id === appointment.id ? { ...current, status } : current
      )
      return true
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "The appointment status could not be updated. Please try again."
      setError(message)
      if (status === "completed") setCompletionError(message)
      return false
    } finally {
      setUpdatingId(null)
    }
  }

  const requestStatusChange = (
    appointment: Appointment,
    status: AppointmentStatus
  ) => {
    if (status === "completed") {
      if (!canComplete(appointment)) {
        setError(
          "An appointment can only be completed after its scheduled date and time."
        )
        return
      }
      setCompletionError(null)
      setPendingCompletion(appointment)
      return
    }

    void updateStatus(appointment, status)
  }

  const confirmCompletion = async () => {
    if (!pendingCompletion) return
    if (
      await updateStatus(pendingCompletion, "completed", true)
    ) {
      setPendingCompletion(null)
    }
  }

  if (sessionPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div
        role="alert"
        className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center"
      >
        <AlertCircle className="size-6 text-destructive" aria-hidden />
        <h1 className="font-semibold">Admin access required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Sign in with an administrator account to manage appointments.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Manage Appointments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review bookings, update appointment status, and view payment records.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadAppointments}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Appointments"
          value={summary.total}
          icon={CalendarDays}
          accent="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
        />
        <SummaryCard
          title="Pending"
          value={summary.pending}
          icon={Clock3}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        />
        <SummaryCard
          title="Confirmed"
          value={summary.confirmed}
          icon={CheckCircle2}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        />
        <SummaryCard
          title="Completed"
          value={summary.completed}
          icon={Scissors}
          accent="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
        />
        <SummaryCard
          title="Cancelled"
          value={summary.cancelled}
          icon={XCircle}
          accent="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAppointments}
            disabled={loading}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Try again
          </Button>
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">All appointments</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? "Loading appointments…"
                  : `${filteredAppointments.length} of ${appointments.length} appointments`}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer or ID"
                  aria-label="Search appointments"
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value ?? "all")}
              >
                <SelectTrigger aria-label="Filter by appointment status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {APPOINTMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={paymentFilter}
                onValueChange={(value) => setPaymentFilter(value ?? "all")}
              >
                <SelectTrigger aria-label="Filter by payment status" className="w-full">
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment statuses</SelectItem>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                aria-label="Filter by appointment date"
              />
            </div>
          </div>
        </CardHeader>

        {loading ? (
          <div className="space-y-3 p-4 sm:p-5" aria-label="Loading appointments">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error && appointments.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Appointments are unavailable right now.
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <span className="rounded-full bg-muted p-3">
              <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <h2 className="font-medium">
              {appointments.length === 0
                ? "No appointments yet"
                : "No matching appointments"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {appointments.length === 0
                ? "Customer bookings will appear here when appointments are created."
                : "Try changing the search or filters to find an appointment."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Appointment ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Appointment Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Appointment Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow
                      key={appointment.id || `${appointment.serviceName}-${appointment.date}-${appointment.time}`}
                      className={
                        normalizeStatus(appointment.status) === "cancelled"
                          ? "bg-red-50/60 hover:bg-red-50 dark:bg-red-950/15 dark:hover:bg-red-950/25"
                          : undefined
                      }
                    >
                      <TableCell className="max-w-32 truncate font-mono text-xs text-muted-foreground">
                        {appointment.id || "—"}
                      </TableCell>
                      <TableCell className="min-w-36 font-medium">
                        {appointment.customerName || "—"}
                      </TableCell>
                      <TableCell className="min-w-48 text-muted-foreground">
                        {appointment.customerEmail || "—"}
                      </TableCell>
                      <TableCell className="min-w-36">
                        {appointment.serviceName || "—"}
                      </TableCell>
                      <TableCell className="min-w-32">
                        {formatDate(appointment.date)}
                      </TableCell>
                      <TableCell className="min-w-24">
                        {appointment.time || "—"}
                      </TableCell>
                      <TableCell className="min-w-24">
                        {formatPrice(appointment.price)}
                      </TableCell>
                      <TableCell className="min-w-36">
                        {formatDate(appointment.createdAt)}
                      </TableCell>
                      <TableCell className="min-w-44">
                        <div className="flex flex-col items-start gap-2">
                          <AppointmentStatusBadge status={appointment.status} />
                          <StatusSelect
                            appointment={appointment}
                            disabled={updatingId !== null}
                            onChange={requestStatusChange}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="min-w-32">
                        <PaymentStatusBadge status={appointment.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetails(appointment)}
                        >
                          <Eye className="size-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filteredAppointments.map((appointment) => (
                <article
                  key={appointment.id || `${appointment.serviceName}-${appointment.date}-${appointment.time}`}
                  className={`space-y-3 rounded-xl border p-4 ${
                    normalizeStatus(appointment.status) === "cancelled"
                      ? "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/15"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {appointment.serviceName || "Appointment"}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {appointment.customerName || "Unknown customer"} ·{" "}
                        {appointment.customerEmail || "No email"}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Appointment ID</p>
                      <p className="mt-0.5 truncate font-mono">
                        {appointment.id || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Appointment date</p>
                      <p className="mt-0.5">
                        {formatDate(appointment.date)} · {appointment.time || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Service price</p>
                      <p className="mt-0.5">{formatPrice(appointment.price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Booking date</p>
                      <p className="mt-0.5">{formatDate(appointment.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment status</p>
                      <div className="mt-1">
                        <PaymentStatusBadge status={appointment.paymentStatus} />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <StatusSelect
                      appointment={appointment}
                      disabled={updatingId !== null}
                      onChange={requestStatusChange}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setDetails(appointment)}
                    >
                      <Eye className="size-4" />
                      View details
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={details !== null}
        onOpenChange={(open) => {
          if (!open) setDetails(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {details && (
            <>
              <DialogHeader>
                <DialogTitle>Appointment details</DialogTitle>
                <DialogDescription>
                  Complete booking, customer, service, and payment information.
                </DialogDescription>
              </DialogHeader>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Customer information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={UserRound}
                    label="Customer name"
                    value={details.customerName || "—"}
                  />
                  <DetailItem
                    icon={Mail}
                    label="Customer email"
                    value={details.customerEmail || "—"}
                  />
                  <DetailItem
                    icon={UserRound}
                    label="Customer ID"
                    value={details.userId || "—"}
                  />
                </div>
              </section>

              <section className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Service details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={Scissors}
                    label="Service name"
                    value={details.serviceName || "—"}
                  />
                  <DetailItem
                    icon={FileText}
                    label="Service ID"
                    value={details.serviceId || "—"}
                  />
                  <DetailItem
                    icon={CreditCard}
                    label="Service price"
                    value={formatPrice(details.price)}
                  />
                  <DetailItem
                    icon={Clock3}
                    label="Duration"
                    value={details.duration || "—"}
                  />
                </div>
              </section>

              <section className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Appointment</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={FileText}
                    label="Appointment ID"
                    value={details.id || "—"}
                  />
                  <DetailItem
                    icon={CalendarDays}
                    label="Appointment date"
                    value={formatDate(details.date)}
                  />
                  <DetailItem
                    icon={Clock3}
                    label="Appointment time"
                    value={details.time || "—"}
                  />
                  <DetailItem
                    icon={CalendarDays}
                    label="Booking date"
                    value={formatBookingDate(details.createdAt)}
                  />
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Appointment status
                    </p>
                    <AppointmentStatusBadge status={details.status} />
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Payment details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Payment status
                    </p>
                    <PaymentStatusBadge status={details.paymentStatus} />
                  </div>
                  <DetailItem
                    icon={CreditCard}
                    label="Payment method"
                    value={details.paymentMethod || "Not recorded"}
                  />
                  <DetailItem
                    icon={FileText}
                    label="Transaction ID"
                    value={details.transactionId || "Not recorded"}
                  />
                  <DetailItem
                    icon={CreditCard}
                    label="Payment amount"
                    value={formatPrice(details.paymentAmount)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment status is read-only here and must be confirmed by a
                  future payment integration.
                </p>
              </section>

              <section className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold">Booking notes</h3>
                <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-3 text-sm leading-6">
                  {details.notes || "No booking notes provided."}
                </p>
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingCompletion !== null}
        onOpenChange={(open) => {
          if (!open && updatingId === null) {
            setPendingCompletion(null)
            setCompletionError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm service completion</DialogTitle>
            <DialogDescription>
              Only continue if the scheduled time has passed and the salon
              service was actually provided.
            </DialogDescription>
          </DialogHeader>
          {completionError && (
            <p role="alert" className="text-sm text-destructive">
              {completionError}
            </p>
          )}
          {pendingCompletion && (
            <p className="text-sm text-muted-foreground">
              {pendingCompletion.serviceName} ·{" "}
              {formatDate(pendingCompletion.date)} · {pendingCompletion.time}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingCompletion(null)}
              disabled={updatingId !== null}
            >
              Not yet
            </Button>
            <Button
              onClick={confirmCompletion}
              disabled={updatingId !== null}
            >
              {updatingId ? "Updating…" : "Confirm service was provided"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
