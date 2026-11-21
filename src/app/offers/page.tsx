import type { Metadata } from "next";
import { Ticket } from "lucide-react";
import OffersBrowser from "../components/offers-browser";

export const metadata: Metadata = {
  title: "Offers | SalonBook",
  description:
    "Discover current SalonBook deals — exclusive discounts on hair, nails, facials, spa treatments and more. Grab a promo code and save on your next appointment.",
};

export default function OffersPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <section className="relative overflow-hidden border-b border-black/[.06] bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:border-white/[.08] dark:from-rose-950/30 dark:via-zinc-950 dark:to-purple-950/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 text-center md:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-medium text-rose-600 backdrop-blur dark:border-rose-500/30 dark:bg-zinc-900/80 dark:text-rose-400">
            <Ticket className="size-3.5" />
            Exclusive Deals
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
            Offers &amp; Savings
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Treat yourself for less — browse our latest salon deals, copy a
            promo code and enjoy savings on your next haircut, facial, manicure
            or spa session.
          </p>
        </div>
      </section>

      <OffersBrowser />
    </div>
  );
}
