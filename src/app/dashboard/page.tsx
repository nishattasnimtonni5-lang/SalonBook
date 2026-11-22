"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"

import {
  CalendarDays,
  CalendarX2,
  CircleCheck,
  Clock,
  Heart,
  RefreshCw,
  Scissors,
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  getFavouritesSnapshot,
  getServerFavouritesSnapshot,
  parseFavourites,
  subscribeFavourites,
} from "@/lib/favourites"

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

function formatBookingDate(value: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
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

/** "YYYY-MM-DD" for today in the browser's local time. */
function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function isUpcoming(appointment: Appointment) {
  return (
    (appointment.status === "pending" ||
      appointment.status === "confirmed") &&
    appointment.date >= todayIso()
  )
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

async function fetchAppointments(): Promise<Appointment[]> {
  const response = await fetch(API_URL, { cache: "no-store", credentials: "include" })
  if (!response.ok) throw new Error("Failed to fetch appointments")
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

/* ------------------------------------------------------------------ */

export default function OverviewPage() {
  const { data: session, isPending } = authClient.useSession()
  const userId = session?.user?.id
  const firstName = session?.user?.name?.split(" ")[0]

  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Derived loading state so the effect never sets state synchronously.
  const loading =
    isPending || (!!userId && appointments === null && error === null)
  const list = useMemo(() => appointments ?? [], [appointments])

  const favouritesRaw = useSyncExternalStore(
    subscribeFavourites,
    getFavouritesSnapshot,
    getServerFavouritesSnapshot
  )
  const favourites = useMemo(() => parseFavourites(favouritesRaw), [
    favouritesRaw,
  ])

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

  // Fetch this customer's appointments once the session is known.
  // State is only updated inside the async callbacks, never synchronously.
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

  const stats = useMemo(() => {
    const upcomingList = list.filter(isUpcoming)
    return {
      total: list.length,
      upcoming: upcomingList.length,
      completed: list.filter((item) => item.status === "completed").length,
      favourites: favourites.length,
    }
  }, [list, favourites])

  const nearestUpcoming = useMemo(() => {
    return (
      list
        .filter(isUpcoming)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.createdAt.localeCompare(b.createdAt)
        )[0] ?? null
    )
  }, [list])

  const recentActivity = useMemo(() => {
    return [...list]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
  }, [list])

  const summaryCards = [
    {
      label: "Total Appointments",
      value: stats.total,
      icon: CalendarDays,
      tint: "bg-[#b0764a]/10 text-[#b0764a]",
    },
    {
      label: "Upcoming Appointments",
      value: stats.upcoming,
      icon: Clock,
      tint: "bg-amber-600/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Completed Visits",
      value: stats.completed,
      icon: CircleCheck,
      tint: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Favourite Services",
      value: stats.favourites,
      icon: Heart,
      tint: "bg-pink-600/10 text-pink-600 dark:text-pink-400",
    },
  ]

  const showErrorBanner = Boolean(error) && !loading

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isPending ? (
            <Skeleton className="h-7 w-56" />
          ) : firstName ? (
            `Welcome back, ${firstName}`
          ) : (
            "Welcome back"
          )}
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Here is a quick look at your bookings, visits and favourite services.
        </p>
        {!isPending && !userId && (
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to see your personalised overview.{" "}
            <Link href="/signin" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>

      {showErrorBanner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw /> Retry
          </Button>
        </div>
      )}

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} size="sm">
                <CardContent className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </>
      ) : error && appointments === null ? (
        // The retry banner above is the only content until a fetch succeeds.
        null
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label} size="sm">
                <CardContent className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.tint}`}
                  >
                    <card.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-semibold tracking-tight">
                      {card.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Upcoming appointment */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>Upcoming Appointment</CardTitle>
                    <CardDescription>
                      Your nearest scheduled salon visit.
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/my-appointments">
                    <Button variant="outline" size="sm">
                      View All Appointments
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {!nearestUpcoming ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarX2 />
                      </EmptyMedia>
                      <EmptyTitle>No upcoming appointments</EmptyTitle>
                      <EmptyDescription>
                        When you book a future visit, it will appear here.
                      </EmptyDescription>
                    </EmptyHeader>
                    <Link href="/services">
                      <Button
                        variant="outline"
                        className="mt-2"
                      >
                        Browse services
                      </Button>
                    </Link>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-square sm:size-28">
                      {nearestUpcoming.serviceImage ? (
                        <Image
                          src={nearestUpcoming.serviceImage}
                          alt={nearestUpcoming.serviceName}
                          fill
                          sizes="(max-width: 640px) 100vw, 112px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <Scissors className="size-6" aria-hidden />
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className="truncate font-medium leading-snug"
                          title={nearestUpcoming.serviceName}
                        >
                          {nearestUpcoming.serviceName}
                        </h3>
                        <span className="shrink-0 font-semibold">
                          {formatPrice(nearestUpcoming.price)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {formatDate(nearestUpcoming.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden />
                          {nearestUpcoming.time}
                        </span>
                      </div>
                      <div>
                        <StatusBadge status={nearestUpcoming.status} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favourite services */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>Favourite Services</CardTitle>
                    <CardDescription>
                      Services you have saved for later.
                    </CardDescription>
                  </div>
                  <Link href="/services">
                    <Button variant="outline" size="sm">
                      Browse Services
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {favourites.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Heart />
                      </EmptyMedia>
                      <EmptyTitle>No favourites yet</EmptyTitle>
                      <EmptyDescription>
                        Save the services you love and they will show up here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {favourites.slice(0, 6).map((favourite) => (
                      <div
                        key={String(favourite.id)}
                        className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          {favourite.image ? (
                            <Image
                              src={favourite.image}
                              alt={favourite.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 160px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-muted-foreground">
                              <Scissors className="size-5" aria-hidden />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 p-2.5">
                          <span
                            className="truncate text-sm font-medium"
                            title={favourite.name}
                          >
                            {favourite.name}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {formatPrice(favourite.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent booking activity */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>Recent Booking Activity</CardTitle>
                  <CardDescription>
                    Your latest bookings and their current status.
                  </CardDescription>
                </div>
                <Link href="/dashboard/booking-history">
                  <Button variant="outline" size="sm">
                    View Booking History
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarX2 />
                    </EmptyMedia>
                    <EmptyTitle>No booking activity yet</EmptyTitle>
                    <EmptyDescription>
                      Your most recent bookings will appear here as soon as you
                      reserve a service.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="flex flex-col divide-y divide-border/60">
                  {recentActivity.map((item) => (
                    <li
                      key={item._id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#b0764a]/10 text-[#b0764a]"
                        >
                          <Scissors className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-medium"
                            title={item.serviceName}
                          >
                            {item.serviceName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Booked on {formatBookingDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
