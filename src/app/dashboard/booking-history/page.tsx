"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import {
  CalendarDays,
  CalendarX2,
  CircleCheck,
  CircleX,
  History,
  RefreshCw,
  Scissors,
  Search,
  SearchX,
} from "lucide-react"

import { authClient } from "@/app/lib/auth-client"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const API_URL = "http://localhost:8000/appointments"

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
  createdAt: string
}

type HistoryFilter = "all" | "completed" | "cancelled"

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

/** Timestamp used for ordering visits (appointment date, fallback created). */
function dateOf(appointment: Appointment) {
  const date = new Date(appointment.date || appointment.createdAt)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function isPaid(appointment: Appointment) {
  return (appointment.paymentStatus ?? "").toLowerCase() === "paid"
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

function PaymentBadge({ appointment }: { appointment: Appointment }) {
  const paid = isPaid(appointment)
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

async function fetchAppointments(): Promise<Appointment[]> {
  const response = await fetch(API_URL, { cache: "no-store", credentials: "include" })
  if (!response.ok) throw new Error("Failed to fetch appointments")
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
]

export default function BookingHistoryPage() {
  const { data: session, isPending } = authClient.useSession()
  const userId = session?.user?.id

  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<HistoryFilter>("all")

  // Derived, so the effect never has to set state synchronously:
  // waiting for the session, or for the first fetch to settle, counts as loading.
  const loading =
    isPending || (!!userId && appointments === null && error === null)
  const list = useMemo(() => appointments ?? [], [appointments])

  useEffect(() => {
    if (!userId) return
    let active = true
    fetchAppointments()
      .then((data) => {
        if (!active) return
        // Only this customer's bookings are shown.
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

  const stats = useMemo(() => {
    const completed = list.filter(
      (item) => item.status === "completed"
    ).length
    const cancelled = list.filter(
      (item) => item.status === "cancelled"
    ).length

    const counts = new Map<string, number>()
    const latest = new Map<string, number>()
    for (const item of list) {
      const name = item.serviceName
      counts.set(name, (counts.get(name) ?? 0) + 1)
      latest.set(name, Math.max(latest.get(name) ?? 0, dateOf(item)))
    }

    let mostBooked = ""
    let bestCount = 0
    let bestLatest = -1
    for (const [name, count] of counts) {
      const last = latest.get(name) ?? 0
      if (count > bestCount || (count === bestCount && last > bestLatest)) {
        mostBooked = name
        bestCount = count
        bestLatest = last
      }
    }

    return {
      total: list.length,
      completed,
      cancelled,
      mostBooked: mostBooked || "—",
    }
  }, [list])

  const filterCounts = useMemo(
    () => ({
      all: list.length,
      completed: stats.completed,
      cancelled: stats.cancelled,
    }),
    [list.length, stats]
  )

  // Most recently completed visits first, then remaining visits by date.
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return list
      .filter(
        (item) => filter === "all" || item.status === filter
      )
      .filter(
        (item) =>
          !normalizedQuery ||
          item.serviceName.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => {
        const aCompleted = a.status === "completed" ? 0 : 1
        const bCompleted = b.status === "completed" ? 0 : 1
        if (aCompleted !== bCompleted) return aCompleted - bCompleted
        return dateOf(b) - dateOf(a)
      })
  }, [list, filter, query])

  const statCards = [
    {
      label: "Total Appointments",
      value: stats.total,
      icon: CalendarDays,
      tint: "bg-[#b0764a]/10 text-[#b0764a]",
    },
    {
      label: "Total Completed Visits",
      value: stats.completed,
      icon: CircleCheck,
      tint: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Cancelled Bookings",
      value: stats.cancelled,
      icon: CircleX,
      tint: "bg-red-600/10 text-red-600 dark:text-red-400",
    },
    {
      label: "Most Booked Service",
      value: stats.mostBooked,
      icon: Scissors,
      tint: "bg-sky-600/10 text-sky-600 dark:text-sky-400",
    },
  ]

  const clearSearch = () => {
    setQuery("")
    setFilter("all")
  }

  const showNoResults =
    !loading && !error && list.length > 0 && results.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Booking History
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          A look back at your salon visits — completed appointments, cancelled
          bookings, and spending at a glance.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} size="sm">
                <CardContent className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => (
              <Card key={card.label} size="sm">
                <CardContent className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.tint}`}
                  >
                    <card.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {card.label}
                    </p>
                    {typeof card.value === "number" ? (
                      <p className="text-2xl font-semibold tracking-tight">
                        {card.value}
                      </p>
                    ) : (
                      <p
                        className="truncate text-base font-semibold"
                        title={card.value}
                      >
                        {card.value}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle>Recent Visit History</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading your visit history…"
                  : `${results.length} of ${list.length} ${list.length === 1 ? "visit" : "visits"}`}
              </CardDescription>
            </div>

            {!isPending && userId && !loading && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by service name…"
                    aria-label="Search services"
                    className="pl-8"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {FILTERS.map((item) => (
                    <Button
                      key={item.key}
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-pressed={filter === item.key}
                      className={
                        filter === item.key
                          ? "border-transparent bg-[#b0764a] text-white hover:bg-[#9a643f] hover:text-white"
                          : undefined
                      }
                      onClick={() => setFilter(item.key)}
                    >
                      {item.label}
                      <span
                        className={filter === item.key ? "" : "text-muted-foreground"}
                      >
                        ({filterCounts[item.key]})
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl ring-1 ring-foreground/10"
                >
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-3 w-1/3" />
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error && appointments === null ? (
            // Error banner above is the only content until a retry succeeds.
            null
          ) : !isPending && !userId ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <History />
                </EmptyMedia>
                <EmptyTitle>Sign in to view your history</EmptyTitle>
                <EmptyDescription>
                  Your booking history is linked to your account. Sign in to see
                  your completed and cancelled salon visits.
                </EmptyDescription>
              </EmptyHeader>
              <Link href="/signin">
                <Button className="mt-2 bg-[#b0764a] text-white hover:bg-[#9a643f]">
                  Sign in
                </Button>
              </Link>
            </Empty>
          ) : list.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarX2 />
                </EmptyMedia>
                <EmptyTitle>No booking history yet</EmptyTitle>
                <EmptyDescription>
                  Once you book a salon service, your visits will appear here
                  with their final status.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : showNoResults ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No matching visits</EmptyTitle>
                <EmptyDescription>
                  {query.trim()
                    ? `Nothing matches “${query.trim()}”${filter !== "all" ? ` in ${filter} visits` : ""}.`
                    : `There are no ${filter} visits yet.`}
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                className="mt-2"
                onClick={clearSearch}
              >
                Clear search & filters
              </Button>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((appointment) => (
                <article
                  key={appointment._id}
                  className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {appointment.serviceImage ? (
                      <Image
                        src={appointment.serviceImage}
                        alt={appointment.serviceName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <Scissors className="size-6" aria-hidden />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="truncate font-medium leading-snug"
                        title={appointment.serviceName}
                      >
                        {appointment.serviceName}
                      </h3>
                      <span className="shrink-0 font-semibold">
                        {formatPrice(appointment.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays
                        aria-hidden
                        className="size-3.5 shrink-0"
                      />
                      <span className="truncate">
                        {formatDate(appointment.date)}
                        {appointment.time ? ` · ${appointment.time}` : ""}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <StatusBadge status={appointment.status} />
                      <PaymentBadge appointment={appointment} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
