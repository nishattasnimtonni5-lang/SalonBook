import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import ServicesBrowser from "../components/services-browser";

export const metadata: Metadata = {
  title: "Browse Services | SalonBook",
  description:
    "Explore salon services — haircuts, colouring, nails, facials, massages and more. Find the perfect treatment and book your appointment online with SalonBook.",
};

export default function ServicesPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <section className="relative overflow-hidden border-b border-black/[.06] bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:border-white/[.08] dark:from-rose-950/30 dark:via-zinc-950 dark:to-purple-950/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 text-center md:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-medium text-rose-600 backdrop-blur dark:border-rose-500/30 dark:bg-zinc-900/80 dark:text-rose-400">
            <Sparkles className="size-3.5" />
            Our Menu
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
            Browse Services
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            From fresh cuts and vibrant colour to relaxing facials and massages
            — explore our full menu of salon services and find the perfect
            treatment for you.
          </p>
        </div>
      </section>

      <ServicesBrowser />
    </div>
  );
}
