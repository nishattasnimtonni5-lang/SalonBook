import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { ArrowLeft, CalendarCheck, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { services, type Service } from "@/app/data/services";
import AppointmentForm from "./appointmentForm";

type ApiService = {
  _id: string;
  name: string;
  category?: string;
  price?: number;
  image?: string;
  status?: string;
  duration?: string;
  description?: string;
};

type ServiceDetail = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  image: string;
};

// The API doesn't return duration/description yet — reuse the same fallback
// copy as the featured services section so the page never renders empty.
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

function fromApi(api: ApiService): ServiceDetail {
  const fallback = serviceExtras[api.name] ?? defaultExtras;
  return {
    id: api._id,
    name: api.name,
    category: api.category ?? "Salon",
    description: api.description ?? fallback.description,
    price: api.price ?? 0,
    duration: api.duration ?? fallback.duration,
    image: api.image ?? "/services/haircut.svg",
  };
}

function fromLocal(service: Service): ServiceDetail {
  return { ...service };
}

async function getApiServices(): Promise<ApiService[]> {
  const res = await fetch("http://localhost:8000/services", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`services request failed: ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("unexpected services payload");
  return data.filter(
    (item): item is ApiService =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ApiService).name === "string",
  );
}

async function getService(id: string): Promise<ServiceDetail | null> {
  // The API only exposes the collection endpoint (`GET /services`), so pull
  // the list and pick the matching record by its Mongo `_id`.
  try {
    const apiList = await getApiServices();
    const match =
      apiList.find((item) => item._id === id) ??
      apiList.find((item) => item.name === id);
    if (match) return fromApi(match);
  } catch {
    // API unreachable — fall back to the local catalogue below.
  }

  // Fall back to the static catalogue used by the browse-services page.
  const local = services.find(
    (service) => service.id === id || service.name === id,
  );
  return local ? fromLocal(local) : null;
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const service = await getService(decodeURIComponent(id));

  if (!service) {
    return { title: "Service Not Found | SalonBook" };
  }

  return {
    title: `${service.name} | SalonBook`,
    description: service.description,
  };
}

const ServiceDetailsPage = async ({ params }: PageProps) => {
  const { id } = await params;

  // Protect details page: redirect visitors to sign in if not authenticated
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/signin?callbackURL=/services/${encodeURIComponent(id)}`);
  }

  const service = await getService(decodeURIComponent(id));

  if (!service) notFound();

  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <section className="relative overflow-hidden border-b border-black/[.06] bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:border-white/[.08] dark:from-rose-950/30 dark:via-zinc-950 dark:to-purple-950/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-12">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
          >
            <ArrowLeft className="size-4" />
            Back to services
          </Link>

          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-medium text-rose-600 backdrop-blur dark:border-rose-500/30 dark:bg-zinc-900/80 dark:text-rose-400">
            <Tag className="size-3.5" />
            {service.category}
          </span>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {service.name}
          </h1>
        </div>
      </section>

      {/* Details */}
      <section className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Service image */}
          <div className="relative overflow-hidden rounded-2xl border border-black/[.06] bg-gradient-to-br from-rose-50 to-purple-50 dark:border-white/[.08] dark:from-rose-950/30 dark:to-purple-950/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={service.image}
              alt={service.name}
              width={1200}
              height={900}
              className="aspect-[4/3] w-full object-cover"
            />
            <Badge className="absolute top-4 left-4 border border-white/40 bg-white/90 text-rose-600 backdrop-blur hover:bg-white dark:bg-zinc-900/90 dark:text-rose-400">
              {service.category}
            </Badge>
          </div>

          {/* Service information */}
          <div className="flex flex-col">
            <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
              {service.description}
            </p>

            {/* Price + estimated duration */}
            <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-black/[.06] bg-white p-4 dark:border-white/[.08] dark:bg-zinc-900">
                <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Price
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-rose-600">
                  ${service.price}
                </dd>
              </div>
              <div className="rounded-xl border border-black/[.06] bg-white p-4 dark:border-white/[.08] dark:bg-zinc-900">
                <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Estimated Duration
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  <Clock className="size-4 text-rose-500" />
                  {service.duration}
                </dd>
              </div>
            </dl>

            {/* Appointment booking option */}
            <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/30 dark:bg-rose-500/10">
              
             <AppointmentForm service={service}/>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceDetailsPage;
