"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import { RefreshCw, Scissors, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import ServiceCard from "./service-card";

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

async function fetchServices(): Promise<ApiService[]> {
  const res = await fetch("http://localhost:8000/services", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load services");
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected services payload");
  return data.filter(
    (item): item is ApiService =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ApiService)._id === "string" &&
      typeof (item as ApiService).name === "string",
  );
}

export default function ServicesBrowser() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetchServices()
      .then((data) => {
        if (!active) return;
        setServices(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const reload = () => {
    setLoading(true);
    setError(null);
    fetchServices()
      .then((data) => {
        setServices(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => setLoading(false));
  };

  const serviceCategories = [
    "All",
    ...Array.from(
      new Set(
        services
          .map((service) => service.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ),
  ];

  const visibleServices = services.filter((service) => {
    const matchesCategory =
      activeCategory === "All" || service.category === activeCategory;

    const matchesSearch = service.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-20">
      {!loading && !error && (
        <div className="mb-6">
          <div className="relative mx-auto max-w-md">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="search"
              placeholder="Search services by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-full border-black/[.10] bg-white pl-11 dark:border-white/[.145] dark:bg-zinc-900"
            />
          </div>
        </div>
      )}

      {!loading && !error && serviceCategories.length > 1 && (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {serviceCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === category
                    ? "border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-500/25"
                    : "border-black/[.08] bg-white text-zinc-600 hover:border-rose-300 hover:text-rose-600 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-rose-500/50 dark:hover:text-rose-400",
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Showing {visibleServices.length} of {services.length} services
          </p>
        </>
      )}

      {loading && (
        <div
          aria-busy="true"
          aria-label="Loading services"
          className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-black/[.06] bg-white dark:border-white/[.08] dark:bg-zinc-900"
            >
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-2 flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 py-14 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <Scissors className="mx-auto size-8 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
            We couldn&apos;t load the services.
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

      {!loading && !error && visibleServices.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-black/[.08] bg-zinc-50 px-6 py-14 text-center dark:border-white/[.12] dark:bg-zinc-900">
          <Scissors className="mx-auto size-8 text-rose-400" />
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {services.length === 0
              ? "No services available right now."
              : searchQuery.trim()
                ? `No services found for "${searchQuery}".`
                : activeCategory !== "All"
                  ? `No services in ${activeCategory} yet.`
                  : "No matching services found."}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Please check back soon — new treatments are added regularly.
          </p>
        </div>
      )}

      {!loading && !error && visibleServices.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={{
                id: service._id,
                name: service.name,
                category: service.category ?? "Salon",
                price: service.price ?? 0,
                image: service.image ?? "/services/haircut.svg",
                description: service.description,
                duration: service.duration,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}