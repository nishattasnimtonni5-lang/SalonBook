import Link from "next/link";
import { ArrowRight, Clock, Heart, Scissors } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ApiService = {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  status?: string;
  duration?: string;
  description?: string;
};

// The API doesn't return duration/description yet — fall back to sensible
// per-service defaults so the cards still show them (API fields win if added later).
const serviceExtras: Record<string, { duration: string; description: string }> = {
  "Hair Styling": {
    duration: "45 min",
    description: "Precision cuts and styling tailored to your face shape and taste.",
  },
  "Hair Coloring": {
    duration: "90 min",
    description: "Vibrant, long-lasting color with a glossy, healthy finish.",
  },
  "Facial Treatment": {
    duration: "60 min",
    description: "Deep-cleansing facial that restores your natural glow.",
  },
  Manicure: {
    duration: "40 min",
    description: "Shape, buff and polish for perfectly groomed hands.",
  },
  Pedicure: {
    duration: "50 min",
    description: "Relaxing soak and scrub for soft, refreshed feet.",
  },
  "Bridal Makeup": {
    duration: "120 min",
    description: "Flawless, photo-ready makeup for your special day.",
  },
};

const defaultExtras = {
  duration: "45 min",
  description: "A professional salon treatment you'll love.",
};

function getExtras(service: ApiService) {
  const fallback = serviceExtras[service.name] ?? defaultExtras;
  return {
    duration: service.duration ?? fallback.duration,
    description: service.description ?? fallback.description,
  };
}

async function getFeaturedServices(): Promise<ApiService[]> {
  try {
    const res = await fetch("http://localhost:8000/services", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    // Only show services that are active (the API already filters, this is a safety net)
    return data.filter(
      (item): item is ApiService =>
        typeof item === "object" &&
        item !== null &&
        (item as { status?: string }).status === "active"
    );
  } catch {
    // API unreachable — render the empty state instead of crashing the page
    return [];
  }
}

const featuedServicesPage = async () => {
  const featuredServices = await getFeaturedServices();

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      {/* ============ Section heading ============ */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">
          Handpicked for you
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Featured Salon Services
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Discover our most popular salon treatments and services.
        </p>
        <Link
          href="/services"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 px-6 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-colors hover:bg-rose-700"
        >
          View All Services
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* ============ Service grid: 1 col mobile, 2 tablet, 3 desktop ============ */}
      {featuredServices.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => {
            const extras = getExtras(service);
            return (
              <Card
                key={service._id}
                className="group h-full pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
              >
                {/* Service image with category overlay */}
                <div className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={service.image}
                    alt={service.name}
                    width={800}
                    height={600}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Button
  variant="ghost"
  size="icon"
  className="absolute right-3 top-3 rounded-full bg-white"
>
  <Heart className="h-5 w-5" />
</Button>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
                  />
                  <Badge className="absolute top-3 left-3 border border-white/40 bg-white/90 text-rose-600 backdrop-blur hover:bg-white dark:bg-zinc-900/90 dark:text-rose-400">
                    {service.category}
                  </Badge>
                </div>

                <CardHeader className="gap-2">
                  <CardTitle className="text-base font-semibold">
                    {service.name}
                  </CardTitle>

                  {/* Duration */}
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <Clock className="size-3.5 text-rose-500" />
                    {extras.duration}
                  </span>

                  {/* Short description */}
                  <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {extras.description}
                  </p>
                </CardHeader>

                <CardFooter className="justify-between gap-2">
                  <span className="text-xl font-semibold text-rose-600">
                    ${service.price}
                  </span>
                  <Link
                    href={`/services/${service._id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700"
                  >
                    View Details
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-black/[.08] bg-zinc-50 px-6 py-14 text-center dark:border-white/[.12] dark:bg-zinc-900">
          <Scissors className="mx-auto size-8 text-rose-400" />
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Featured services are unavailable right now.
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Please check back soon — new treatments are added regularly.
          </p>
        </div>
      )}
    </section>
  );
};

export default featuedServicesPage;
