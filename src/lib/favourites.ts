/**
 * Shared localStorage-backed favourites store.
 *
 * Contract used by the Featured Services cards, the Favourites dashboard
 * page and the Overview page:
 *
 * - Key:   localStorage["salonbook:favourites"]
 * - Value: JSON array of { id, name, image, price, category?, duration? }
 * - After every write the "salonbook-favourites-change" event is dispatched
 *   on `window` so every subscriber (same tab) re-renders immediately.
 *   Cross-tab updates are covered by the native "storage" event.
 */

export type FavouriteService = {
  id: string
  name: string
  image: string
  price: number
  category?: string
  duration?: string
}

export const FAVOURITES_KEY = "salonbook:favourites"
export const FAVOURITES_EVENT = "salonbook-favourites-change"

function normalize(item: unknown): FavouriteService | null {
  if (typeof item !== "object" || item === null) return null
  const record = item as Record<string, unknown>

  const rawId = record.id
  if (typeof rawId !== "string" && typeof rawId !== "number") return null
  if (typeof record.name !== "string" || !record.name) return null

  return {
    id: String(rawId),
    name: record.name,
    image: typeof record.image === "string" ? record.image : "",
    price: typeof record.price === "number" ? record.price : 0,
    category:
      typeof record.category === "string" ? record.category : undefined,
    duration:
      typeof record.duration === "string" ? record.duration : undefined,
  }
}

/** Parse + validate a raw localStorage snapshot. Never throws. */
export function parseFavourites(raw: string): FavouriteService[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const result: FavouriteService[] = []
    for (const entry of parsed) {
      const item = normalize(entry)
      // Skip invalid entries and any duplicate id (first one wins).
      if (!item || seen.has(item.id)) continue
      seen.add(item.id)
      result.push(item)
    }
    return result
  } catch {
    return []
  }
}

/* --- useSyncExternalStore snapshots (stable string values) --- */

export function getFavouritesSnapshot(): string {
  try {
    return window.localStorage.getItem(FAVOURITES_KEY) ?? "[]"
  } catch {
    return "[]"
  }
}

export function getServerFavouritesSnapshot(): string {
  return "[]"
}

export function subscribeFavourites(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange()
  window.addEventListener("storage", handler)
  window.addEventListener(FAVOURITES_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(FAVOURITES_EVENT, handler)
  }
}

/* --- reads / writes --- */

export function readFavourites(): FavouriteService[] {
  return parseFavourites(getFavouritesSnapshot())
}

export function isFavourite(id: string | number): boolean {
  const key = String(id)
  return readFavourites().some((item) => item.id === key)
}

function persist(list: FavouriteService[]): void {
  try {
    window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify(list))
  } catch {
    // Storage full / private mode — subscribers simply keep the old state.
  }
  window.dispatchEvent(new Event(FAVOURITES_EVENT))
}

/**
 * Add the service if it is not saved yet, remove it otherwise.
 * Duplicates are impossible: entries are keyed by `id`.
 * Returns `true` when the service is now a favourite.
 */
export function toggleFavourite(service: FavouriteService): boolean {
  const id = String(service.id)
  const list = readFavourites()
  const exists = list.some((item) => item.id === id)

  if (exists) {
    persist(list.filter((item) => item.id !== id))
    return false
  }

  persist([...list, { ...service, id }])
  return true
}

/** Remove a service by id (no-op when it is not saved). */
export function removeFavourite(id: string | number): void {
  const key = String(id)
  const list = readFavourites()
  if (!list.some((item) => item.id === key)) return
  persist(list.filter((item) => item.id !== key))
}
