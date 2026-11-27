"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Percent,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { OFFERS_API_URL } from "@/app/lib/api/config";
import {
  filterValidOffers,
  formatDiscountLabel,
  formatExpiryDate,
  isOfferVisible,
  type Offer,
} from "@/lib/offers";

export default function OffersBrowser() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOffers = useCallback(async (): Promise<Offer[]> => {
    const response = await fetch(OFFERS_API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Offers could not be loaded.");
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Unexpected offers response.");
    }
    return filterValidOffers(data);
  }, []);

  useEffect(() => {
    let active = true;
    fetchOffers()
      .then((data) => {
        if (!active) return;
        setOffers(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setOffers([]);
        setError(
          err instanceof Error
            ? err.message
            : "Offers could not be loaded. Please try again.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchOffers]);

  const reload = () => {
    setLoading(true);
    setError(null);
    fetchOffers()
      .then((data) => {
        setOffers(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setOffers([]);
        setError(
          err instanceof Error
            ? err.message
            : "Offers could not be loaded. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  };

  const copyCoupon = async (offer: Offer) => {
    const promoCode = offer.promoCode || offer.couponCode;
    if (!promoCode) return;

    try {
      await navigator.clipboard.writeText(promoCode);
    } catch {
      // Clipboard blocked (non-secure context): temporary textarea fallback
      // so the button still works; the code is visible on the card anyway.
      const textarea = document.createElement("textarea");
      textarea.value = promoCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // Ignore — nothing else we can do.
      }
      document.body.removeChild(textarea);
    }

    setCopiedId(offer._id);
    window.setTimeout(
      () => setCopiedId((id) => (id === offer._id ? null : id)),
      2000,
    );
  };

  // Only offers that are switched on and not past their expiry date.
  const visibleOffers = offers.filter(isOfferVisible);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-20">
      {/* Loading state */}
      {loading && (
        <div
          aria-busy="true"
          aria-label="Loading offers"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-black/[.06] bg-white dark:border-white/[.08] dark:bg-zinc-900"
            >
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 py-14 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <AlertCircle className="mx-auto size-8 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
            We couldn&apos;t load the offers.
          </p>
          <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
            {error}
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full"
            onClick={reload}
          >
            <RefreshCw /> Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && visibleOffers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/[.08] bg-zinc-50 px-6 py-16 text-center dark:border-white/[.12] dark:bg-zinc-900">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/15">
            <Ticket className="size-7 text-rose-500" aria-hidden />
          </span>

          <Empty className="mt-4 border-0 bg-transparent p-0 shadow-none">
            <EmptyHeader>
              <EmptyTitle className="text-lg">
                {offers.length === 0
                  ? "No offers available right now."
                  : "No active offers right now."}
              </EmptyTitle>
              <EmptyDescription>
                {offers.length === 0
                  ? "We don't have any deals at the moment — check back soon, new offers are added regularly."
                  : "All of our current deals have expired — check back soon, fresh offers are on the way."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              className="rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700"
              render={<Link href="/services" />}
            >
              Browse services
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={reload}>
              <RefreshCw aria-hidden />
              Refresh offers
            </Button>
          </div>
        </div>
      )}

      {/* Offer cards */}
      {!loading && !error && visibleOffers.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleOffers.map((offer) => (
            <Card
              key={offer._id}
              className="group h-full overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
            >
              {/* Offer image */}
              <div className="relative h-48 w-full overflow-hidden">
                {offer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- API images may be http://, which next/image rejects
                  <img
                    src={offer.image}
                    alt={offer.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
                    <Percent className="size-8 text-rose-400" aria-hidden />
                    No image available
                  </div>
                )}
              </div>

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
                      offer.discountValue,
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
                {/* Promo code + copy button */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-rose-300 bg-rose-50 px-3 py-2.5 dark:border-rose-800 dark:bg-rose-950/30">
                  <span className="truncate font-mono text-sm font-bold tracking-widest text-rose-600 dark:text-rose-400">
                    {offer.promoCode || offer.couponCode || "—"}
                  </span>
                  {offer.promoCode || offer.couponCode ? (
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

                {/* Book Appointment — routes to the existing service booking
                    flow, pre-filling the offer when one service applies. */}
                <Button
                  type="button"
                  render={
                    <Link
                      href={
                        offer.applicableService &&
                        offer.applicableService !== "All services"
                          ? `/services/${encodeURIComponent(offer.applicableService)}?offerId=${encodeURIComponent(offer._id)}&offerTitle=${encodeURIComponent(offer.title)}&discountType=${offer.discountType}&discountValue=${offer.discountValue}&promoCode=${encodeURIComponent(offer.promoCode || offer.couponCode || "")}`
                          : "/services"
                      }
                    />
                  }
                  className="rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700"
                >
                  Book Appointment
                </Button>

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
    </section>
  );
}
