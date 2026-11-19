"use client"

import { useCallback, useEffect, useState } from "react"

import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Loader2,
  Percent,
  RefreshCw,
  Ticket,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  formatDiscountLabel,
  formatExpiryDate,
  isOfferExpired,
  type Offer,
} from "@/lib/offers"

const OFFERS_API_URL =
  process.env.NEXT_PUBLIC_OFFERS_API_URL ?? "http://localhost:8000/offers"

/** Keep only well-formed offers (guards against malformed entries). */
function filterValidOffers(data: unknown): Offer[] {
  if (!Array.isArray(data)) return []
  return data.filter(
    (item): item is Offer =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Offer)._id === "string" &&
      typeof (item as Offer).title === "string" &&
      typeof (item as Offer).active === "boolean"
  )
}

// Uppercase name required by the react-hooks rule; the default export is
// still what Next.js renders for /dashboard/offers.
const MyOffersPage = () => {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Pure fetch (no setState) so the effect can kick it off without
  // triggering the set-state-in-effect lint rule; state updates happen
  // in the async callbacks below, exactly like MyAppointmentsPage.
  const fetchOffers = useCallback(async (): Promise<Offer[]> => {
    // Public endpoint: the API itself only returns active + unexpired
    // offers, so customers can never see a deactivated one.
    const response = await fetch(OFFERS_API_URL, { cache: "no-store" })
    if (!response.ok) {
      throw new Error("Offers could not be loaded.")
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error("Unexpected offers response.")
    }
    return filterValidOffers(data)
  }, [])

  useEffect(() => {
    let active = true
    fetchOffers()
      .then((data) => {
        if (!active) return
        setOffers(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setOffers([])
        setError(
          err instanceof Error
            ? err.message
            : "Offers could not be loaded. Please try again."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchOffers])

  const reload = () => {
    setLoading(true)
    setError(null)
    fetchOffers()
      .then((data) => {
        setOffers(data)
        setError(null)
      })
      .catch((err: unknown) => {
        setOffers([])
        setError(
          err instanceof Error
            ? err.message
            : "Offers could not be loaded. Please try again."
        )
      })
      .finally(() => setLoading(false))
  }

  const copyCoupon = async (offer: Offer) => {
    try {
      await navigator.clipboard.writeText(offer.couponCode)
    } catch {
      // Clipboard blocked (non-secure context): temporary textarea fallback
      // so the button still works; the code is visible on the card anyway.
      const textarea = document.createElement("textarea")
      textarea.value = offer.couponCode
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand("copy")
      } catch {
        // Ignore — nothing else we can do.
      }
      document.body.removeChild(textarea)
    }

    setCopiedId(offer._id)
    window.setTimeout(
      () => setCopiedId((id) => (id === offer._id ? null : id)),
      2000
    )
  }

  const visibleOffers = offers.filter((offer) => !isOfferExpired(offer.expiryDate))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My Offers
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Active deals picked for you — copy a coupon code and use it while
          booking your next appointment.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-black/[.08] bg-zinc-50 px-4 py-6 text-sm text-muted-foreground dark:border-white/[.12] dark:bg-zinc-900">
          <Loader2 className="size-4 animate-spin text-rose-500" aria-hidden />
          Loading offers…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={reload}
            >
              <RefreshCw aria-hidden />
              Try again
            </Button>
          </div>
        </div>
      ) : visibleOffers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[.08] bg-zinc-50 px-6 py-16 text-center dark:border-white/[.12] dark:bg-zinc-900">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/15">
            <Ticket className="size-7 text-rose-500" aria-hidden />
          </span>

          <Empty className="mt-4 border-0 bg-transparent p-0 shadow-none">
            <EmptyHeader>
              <EmptyTitle className="text-lg">
                No offers available right now.
              </EmptyTitle>
              <EmptyDescription>
                We don&apos;t have any active deals at the moment — check back
                soon, new offers are added regularly.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>

          <Button
            type="button"
            className="mt-4 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700"
            onClick={reload}
          >
            <RefreshCw aria-hidden />
            Refresh offers
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleOffers.map((offer) => (
            <Card
              key={offer._id}
              className="group h-full overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
            >
              {/* Rose gradient header with the discount label */}
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-500 to-pink-500 px-5 py-5 text-white">
                <div
                  aria-hidden="true"
                  className="absolute -right-6 -top-8 size-28 rounded-full bg-white/15"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-10 -left-6 size-24 rounded-full bg-white/10"
                />

                <div className="relative flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                    <Percent className="size-3.5" aria-hidden />
                    {formatDiscountLabel(
                      offer.discountType,
                      offer.discountValue
                    )}
                  </span>
                  <Badge className="border border-white/40 bg-white/90 text-rose-600 backdrop-blur hover:bg-white dark:bg-zinc-900/90 dark:text-rose-400">
                    {offer.applicableService || "All services"}
                  </Badge>
                </div>

                <h2 className="relative mt-3 text-lg font-semibold leading-snug">
                  {offer.title}
                </h2>
              </div>

              <CardHeader className="gap-2 pb-2">
                <CardTitle className="sr-only">{offer.title}</CardTitle>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {offer.description}
                </p>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 pt-0">
                {/* Coupon code + copy button */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-rose-300 bg-rose-50 px-3 py-2.5 dark:border-rose-800 dark:bg-rose-950/30">
                  <span className="truncate font-mono text-sm font-bold tracking-widest text-rose-600 dark:text-rose-400">
                    {offer.couponCode || "—"}
                  </span>
                  {offer.couponCode ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 rounded-full border-rose-300 bg-white text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-400"
                      onClick={() => void copyCoupon(offer)}
                    >
                      {copiedId === offer._id ? (
                        <>
                          <Check aria-hidden />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy aria-hidden />
                          Copy Code
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>

                {/* Expiry + minimum booking */}
                <div className="flex flex-col gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5 text-rose-500" aria-hidden />
                    Expires on {formatExpiryDate(offer.expiryDate)}
                  </span>
                  {offer.minBookingAmount > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Ticket className="size-3.5 text-rose-500" aria-hidden />
                      Min. booking ${offer.minBookingAmount}
                    </span>
                  ) : null}
                </div>
              </CardContent>

              {offer.terms ? (
                <CardFooter className="mt-auto flex-col items-start gap-1 border-t border-black/[.06] pt-3 dark:border-white/[.08]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Terms &amp; Conditions
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {offer.terms}
                  </p>
                </CardFooter>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyOffersPage
