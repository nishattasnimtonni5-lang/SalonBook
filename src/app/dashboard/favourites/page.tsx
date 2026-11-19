"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"

import { ArrowRight, Clock, Heart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getFavouritesSnapshot,
  getServerFavouritesSnapshot,
  parseFavourites,
  removeFavourite,
  subscribeFavourites,
} from "@/lib/favourites"

// Uppercase name required by the react-hooks rule; the default export is
// still what Next.js renders for /dashboard/favourites.
const FavouritesPage = () => {
  // Shared localStorage snapshot — hearts toggled on the Featured Services
  // section (or here) are reflected everywhere immediately.
  const favouritesRaw = useSyncExternalStore(
    subscribeFavourites,
    getFavouritesSnapshot,
    getServerFavouritesSnapshot
  )
  const favourites = useMemo(() => parseFavourites(favouritesRaw), [
    favouritesRaw,
  ])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My Favourites
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Services you have saved — tap the heart anywhere to add or remove
          them.
        </p>
      </div>

      {favourites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[.08] bg-zinc-50 px-6 py-16 text-center dark:border-white/[.12] dark:bg-zinc-900">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/15">
            <Heart className="size-7 text-rose-500" aria-hidden />
          </span>

          <Empty className="mt-4 border-0 bg-transparent p-0 shadow-none">
            <EmptyHeader>
              <EmptyTitle className="text-lg">
                You haven&apos;t added any favourites yet.
              </EmptyTitle>
              <EmptyDescription>
                Explore our salon services and tap the heart on anything you
                love — it will be saved here for later.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>

          <Link href="/services" className="mt-4 inline-flex">
            <Button className="rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700">
              Browse Services
              <ArrowRight aria-hidden />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favourites.map((favourite) => (
            <Card
              key={favourite.id}
              className="group h-full pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
            >
              <div className="relative overflow-hidden">
                {favourite.image ? (
                  // Same <img> pattern as the featured services cards.
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={favourite.image}
                    alt={favourite.name}
                    width={800}
                    height={600}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-rose-50 dark:bg-rose-950/30">
                    <Heart
                      className="size-8 text-rose-300 dark:text-rose-700"
                      aria-hidden
                    />
                  </div>
                )}

                {/* Heart at the top-right corner — removes instantly. */}
                <button
                  type="button"
                  aria-label={`Remove ${favourite.name} from favourites`}
                  onClick={() => removeFavourite(favourite.id)}
                  className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 dark:bg-zinc-900/90"
                >
                  <Heart
                    className="size-5 fill-red-500 text-red-500"
                    aria-hidden
                  />
                </button>

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
                />

                <Badge className="absolute top-3 left-3 border border-white/40 bg-white/90 text-rose-600 backdrop-blur hover:bg-white dark:bg-zinc-900/90 dark:text-rose-400">
                  {favourite.category ?? "Salon"}
                </Badge>
              </div>

              <CardHeader className="gap-2">
                <CardTitle className="text-base font-semibold">
                  {favourite.name}
                </CardTitle>

                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <Clock className="size-3.5 text-rose-500" aria-hidden />
                  {favourite.duration ?? "45 min"}
                </span>
              </CardHeader>

              <CardFooter className="mt-auto justify-between gap-2 pt-4">
                <span className="text-xl font-semibold text-rose-600">
                  ${favourite.price}
                </span>
                <Link href={`/services/${favourite.id}`}>
                  <Button
                    size="sm"
                    className="rounded-full bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:bg-rose-700"
                  >
                    View Details
                    <ArrowRight aria-hidden />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default FavouritesPage
