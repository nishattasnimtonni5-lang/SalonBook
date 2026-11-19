"use client"

import { useMemo, useSyncExternalStore } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getFavouritesSnapshot,
  getServerFavouritesSnapshot,
  parseFavourites,
  subscribeFavourites,
  toggleFavourite,
  type FavouriteService,
} from "@/lib/favourites"

type FavoriteButtonProps = {
  service: FavouriteService
}

const FavoriteButton = ({ service }: FavoriteButtonProps) => {
  // One shared localStorage snapshot keeps every heart (featured services,
  // favourites page) and the overview in sync.
  const favouritesRaw = useSyncExternalStore(
    subscribeFavourites,
    getFavouritesSnapshot,
    getServerFavouritesSnapshot
  )

  const isFavorite = useMemo(() => {
    const id = String(service.id)
    return parseFavourites(favouritesRaw).some((item) => item.id === id)
  }, [favouritesRaw, service.id])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Remove ${service.name} from favourites`
          : `Add ${service.name} to favourites`
      }
      className="absolute right-3 top-3 rounded-full bg-white shadow-sm hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900"
      onClick={() => toggleFavourite(service)}
    >
      <Heart
        className={`h-5 w-5 transition-transform duration-200 ${
          isFavorite
            ? "scale-110 fill-red-500 text-red-500"
            : "text-gray-500"
        }`}
      />
    </Button>
  )
}

export default FavoriteButton
