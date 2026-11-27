import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BlockedUserGuard from "./BlockedUserGuard";

export type ServiceCardData = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  duration?: string;
};

// The API doesn't return duration/description yet — reuse the same fallback
// copy as the featured services section so the cards never render empty.
const serviceExtras: Record<string, { duration: string; description: string }> =
  {
    "Hair Styling": {
      duration: "45 min",
      description:
        "Precision cuts and styling tailored to your face shape and taste.",
    },
    "Hair Coloring": {
      duration: "90 min",
      description:
        "Vibrant, long-lasting color with a glossy, healthy finish.",
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

export default function ServiceCard({ service }: { service: ServiceCardData }) {
  const fallback = serviceExtras[service.name] ?? defaultExtras;
  const duration = service.duration ?? fallback.duration;
  const description = service.description ?? fallback.description;

  return (
    <BlockedUserGuard>
    <Card className="group h-full pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10">
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
          {duration}
        </span>

        {/* Short description */}
        <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </CardHeader>

      <CardFooter className="justify-between gap-2">
        <span className="text-xl font-semibold text-rose-600">
          ${service.price}
        </span>
        <Button
          render={
            <Link href={`/services/${service.id}`} />
          }
          size="sm"
          className="rounded-full bg-rose-600 px-4 text-white shadow-sm shadow-rose-500/25 hover:bg-rose-700"
        >
          View Details
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
    </BlockedUserGuard>
  );
}
