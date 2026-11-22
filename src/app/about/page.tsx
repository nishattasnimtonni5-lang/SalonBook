import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  HeartHandshake,
  MessageSquare,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | SalonBook",
  description:
    "Learn about SalonBook — the salon appointment booking platform that connects clients with verified beauty professionals and makes booking effortless.",
};

const values = [
  {
    title: "Quality You Can Trust",
    description:
      "Every professional on SalonBook is carefully vetted, so you always know you're in good hands.",
    icon: ShieldCheck,
  },
  {
    title: "Booking Made Simple",
    description:
      "Browse services, pick a time and request your appointment in seconds — no phone calls, no waiting.",
    icon: CalendarCheck,
  },
  {
    title: "Honest & Transparent",
    description:
      "Clear pricing and real client reviews on every service. What you see is what you pay.",
    icon: Tag,
  },
  {
    title: "People First",
    description:
      "We're here to make every visit feel personal, relaxed and effortless — from booking to checkout.",
    icon: HeartHandshake,
  },
];

const stats = [
  { value: "4.9/5", label: "Average client rating" },
  { value: "120+", label: "Verified salon professionals" },
  { value: "15k+", label: "Appointments booked" },
  { value: "100%", label: "Secure online payments" },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <section className="relative overflow-hidden border-b border-black/[.06] bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:border-white/[.08] dark:from-rose-950/30 dark:via-zinc-950 dark:to-purple-950/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 text-center md:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-medium text-rose-600 backdrop-blur dark:border-rose-500/30 dark:bg-zinc-900/80 dark:text-rose-400">
            <Sparkles className="size-3.5" />
            About Us
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
            Great hair days start with{" "}
            <span className="text-rose-600 dark:text-rose-400">SalonBook</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            We make it effortless to discover trusted salons, explore services
            and book your next appointment — so you can spend less time
            searching and more time looking and feeling your best.
          </p>
        </div>
      </section>

      {/* Our story */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">
              Our story
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Salon booking, the way it should be
            </h2>
            <div className="mt-4 space-y-4 text-zinc-600 dark:text-zinc-400">
              <p className="leading-7">
                SalonBook started with a simple frustration: booking a haircut
                or facial shouldn&apos;t mean calling around, waiting on hold or
                guessing at prices. We wanted a single place where anyone can
                find a great salon, see exactly what&apos;s on offer and book it
                right away.
              </p>
              <p className="leading-7">
                Today, SalonBook connects clients with verified beauty
                professionals for haircuts, colouring, nails, facials, makeup
                and more. Every booking, payment and appointment update lives in
                one secure place — for clients and salon teams alike.
              </p>
            </div>

            <Link
              href="/services"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 px-6 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-colors hover:bg-rose-700"
            >
              Explore Services
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Decorative brand panel — reuses the existing salon banner artwork */}
          <div className="relative overflow-hidden rounded-2xl border border-black/[.06] bg-gradient-to-br from-rose-50 via-white to-purple-50 shadow-lg shadow-zinc-900/5 dark:border-white/[.1] dark:from-rose-950/30 dark:via-zinc-900 dark:to-purple-950/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/salon-banner.svg"
              alt="SalonBook brand illustration with salon tools"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/40">
                <Scissors className="size-5" />
              </span>
              <p className="text-lg font-semibold text-white">
                Look good. Feel great. Book easily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 md:py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">
            What we stand for
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            The values behind every booking
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-black/[.06] bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-rose-500/5 dark:border-white/[.1] dark:bg-zinc-900"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm shadow-rose-500/30">
                <value.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews teaser */}
      <section className="border-t border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">
              Client love
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Trusted by clients everywhere
            </h2>
            <div className="mt-4 flex items-center justify-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-5 fill-amber-400" />
              ))}
            </div>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Rated 4.9/5 by clients who booked their salon appointments through
              SalonBook.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/services"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 px-6 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-colors hover:bg-rose-700"
              >
                <MessageSquare className="size-4" />
                Browse Services
              </Link>
              <Link
                href="/offers"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/[.1] bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                <Tag className="size-4" />
                View Offers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
