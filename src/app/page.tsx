import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  MessageSquare,
  Quote,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import FeatuedServices from "./components/featuedServices";

const steps = [
  {
    number: "01",
    title: "Browse Services",
    description:
      "Explore our full menu of salon services and find the perfect treatment for your style.",
    icon: Search,
  },
  {
    number: "02",
    title: "Request a Time",
    description:
      "Pick a service you love and send an appointment request in just a few taps.",
    icon: CalendarCheck,
  },
  {
    number: "03",
    title: "Look & Feel Amazing",
    description:
      "Arrive, relax and enjoy — then walk out looking and feeling your absolute best.",
    icon: Sparkles,
  },
];

const features = [
  {
    title: "Verified Professionals",
    description:
      "Every salon on SalonBook is carefully vetted by our team.",
    icon: ShieldCheck,
  },
  {
    title: "Easy Online Booking",
    description:
      "Request appointments anytime, anywhere — no phone calls needed.",
    icon: CalendarCheck,
  },
  {
    title: "Transparent Prices",
    description:
      "Clear, upfront pricing on every service. No surprises, ever.",
    icon: Tag,
  },
  {
    title: "Real Client Reviews",
    description:
      "Honest feedback from real clients to help you choose with confidence.",
    icon: MessageSquare,
  },
];

const testimonials = [
  {
    name: "Sophie Turner",
    role: "Regular client",
    initials: "ST",
    quote:
      "Booking my haircuts on SalonBook is so easy. I found an amazing stylist near me and never have to wait on hold again.",
  },
  {
    name: "Marcus Chen",
    role: "Happy customer",
    initials: "MC",
    quote:
      "The service menu and prices are crystal clear. I booked a beard trim and facial in under a minute — brilliant experience.",
  },
  {
    name: "Aisha Rahman",
    role: "Bride-to-be",
    initials: "AR",
    quote:
      "I used SalonBook for my wedding makeup and nails. The artists were fantastic and the whole process felt effortless.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ============ Banner / Hero ============ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 md:py-8">
          <div className="group relative w-full overflow-hidden rounded-2xl shadow-xl shadow-zinc-900/10 ring-1 ring-black/5 md:rounded-3xl">
            {/* Winter Special Campaign Banner */}
            <div className="relative aspect-[1672/941] w-full">
              <Image
                src="/winter-special-banner.jpg"
                alt="BelleAura SalonBook — Winter Special, Glow More, Spend Less! Enjoy 25% OFF on Selected Salon Services."
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1152px"
                className="object-cover"
              />

              {/* Exact interactive button positioned seamlessly over the printed image button */}
              <Link
                href="/services"
                aria-label="Book Your Appointment - Winter Special 25% Off"
                className="group/btn absolute flex items-center justify-center gap-1.5 rounded-full bg-[#5c1436] text-white shadow-md transition-all duration-200 select-none hover:bg-[#6c1a40] hover:brightness-110 active:brightness-95 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:outline-none sm:gap-2"
                style={{
                  left: "6.5%",
                  top: "78.2%",
                  width: "25.0%",
                  height: "8.5%",
                }}
              >
                <span className="whitespace-nowrap font-medium text-[clamp(0.55rem,1.35vw,1.15rem)] leading-none tracking-tight">
                  Book Your Appointment
                </span>
                <ArrowRight className="size-[clamp(0.7rem,1.4vw,1.25rem)] shrink-0 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Featured salon services (live from Express API) ============ */}
      <FeatuedServices />

      {/* ============ How it works ============ */}
      <section className="border-y border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">
              Simple as 1-2-3
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              How SalonBook Works
            </h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              From browsing to booking, looking your best has never been easier.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-black/[.06] bg-white p-7 shadow-sm dark:border-white/[.1] dark:bg-zinc-900"
              >
                <span className="absolute top-5 right-5 text-sm font-semibold text-zinc-300 dark:text-zinc-700">
                  {step.number}
                </span>
                <span className="flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  <step.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Why choose us ============ */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">
            Why SalonBook
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Built for Your Beauty Routine
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-black/[.06] bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-rose-500/5 dark:border-white/[.1] dark:bg-zinc-900"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm shadow-rose-500/30">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Testimonials ============ */}
      <section className="border-t border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">
              Client love
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              What Our Clients Say
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <figure
                key={item.name}
                className="flex flex-col rounded-2xl border border-black/[.06] bg-white p-6 shadow-sm dark:border-white/[.1] dark:bg-zinc-900"
              >
                <Quote className="size-6 fill-rose-200 text-rose-200 dark:fill-rose-500/30 dark:text-rose-500/30" />
                <blockquote className="mt-4 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  “{item.quote}”
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                    {item.initials}
                  </span>
                  <figcaption>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.role}
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                    </span>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA band ============ */}
      <section className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-rose-100">
                <Scissors className="size-4" />
                Ready for a fresh new look?
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Your next appointment is just a tap away
              </h2>
              <p className="mt-2 text-sm leading-6 text-rose-100 sm:text-base">
                Join SalonBook today and discover your new favourite salon in
                minutes.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-rose-600 shadow-lg transition-colors hover:bg-rose-50"
              >
                Sign Up Free
              </Link>
              <Link
                href="/services"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/50 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore Services
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
