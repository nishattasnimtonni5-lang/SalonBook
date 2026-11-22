"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  AlertCircle,
  CalendarClock,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Tags,
  Ticket,
  Trash2,
} from "lucide-react"

import { authClient } from "@/app/lib/auth-client"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  EMPTY_OFFER_FORM,
  formatDiscountLabel,
  formatExpiryDate,
  isOfferExpired,
  sanitizeOfferForm,
  validateOfferForm,
  type Offer,
  type OfferFormValues,
} from "@/lib/offers"

const ADMIN_OFFERS_API = "/api/admin/offers"

type FormErrors = Record<string, string>

function offerToForm(offer: Offer): OfferFormValues {
  return {
    title: offer.title,
    description: offer.description,
    discountType: offer.discountType,
    discountValue: String(offer.discountValue),
    applicableService: offer.applicableService,
    couponCode: offer.couponCode,
    expiryDate: offer.expiryDate,
    minBookingAmount: offer.minBookingAmount ? String(offer.minBookingAmount) : "",
    terms: offer.terms,
  }
}

function StatusBadges({ offer }: { offer: Offer }) {
  const expired = isOfferExpired(offer.expiryDate)
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        className={
          offer.active
            ? "gap-1.5 border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "gap-1.5 border-transparent bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        }
      >
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
        {offer.active ? "Active" : "Inactive"}
      </Badge>
      {expired ? (
        <Badge className="gap-1.5 border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
          Expired
        </Badge>
      ) : null}
    </div>
  )
}

// Uppercase name required by the react-hooks rule; the default export is
// still what Next.js renders for /dashboard/admin/offers.
const AdminOffersPage = () => {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const isAdmin = role === "admin"

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [form, setForm] = useState<OfferFormValues>(EMPTY_OFFER_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<Offer | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Activate / deactivate
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Pure fetch (no setState) so the effect can kick it off without
  // tripping the set-state-in-effect lint rule; state updates happen in
  // the async callbacks, exactly like MyAppointmentsPage.
  const fetchOffers = useCallback(async (): Promise<Offer[]> => {
    const response = await fetch(ADMIN_OFFERS_API, { cache: "no-store" })
    const data: unknown = await response.json()

    if (!response.ok) {
      const message =
        typeof (data as { message?: string })?.message === "string"
          ? (data as { message: string }).message
          : "Offers could not be loaded."
      throw new Error(message)
    }

    return Array.isArray(data) ? (data as Offer[]) : []
  }, [])

  // Event-handler version (buttons, post-save refresh): may set state
  // synchronously because it only runs from user interactions.
  const loadOffers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOffers()
      setOffers(data)
      setError(null)
    } catch (err) {
      setOffers([])
      setError(
        err instanceof Error
          ? err.message
          : "Offers could not be loaded. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }, [fetchOffers])

  useEffect(() => {
    // Wait for the session to resolve before hitting the admin API so we
    // don't render a misleading 401 flash for signed-in admins. Non-admins
    // see the access gate below, which renders before any loading state.
    if (sessionPending || !isAdmin) return

    let active = true
    fetchOffers()
      .then((data) => {
        if (!active) return
        setOffers(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setOffers([])
        setError(
          err instanceof Error
            ? err.message
            : "Offers could not be loaded. Please try again."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [sessionPending, isAdmin, fetchOffers])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_OFFER_FORM)
    setFormErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (offer: Offer) => {
    setEditing(offer)
    setForm(offerToForm(offer))
    setFormErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  const setField = <K extends keyof OfferFormValues>(
    key: K,
    value: OfferFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    // Clear the field's error as soon as the user touches it.
    setFormErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const values = sanitizeOfferForm(form)
    const errors = validateOfferForm(values)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      setFormError(null)
      toast.add({
        id: "save-offer",
        type: "error",
        title: "Please fix the highlighted fields",
        description: "Some offer details are missing or invalid.",
      })
      return
    }

    setSaving(true)
    setFormError(null)
    toast.add({
      id: "save-offer",
      type: "loading",
      title: editing ? "Saving offer…" : "Creating offer…",
      description: "Please wait while we save this offer.",
    })
    try {
      const response = await fetch(
        editing ? `${ADMIN_OFFERS_API}/${editing._id}` : ADMIN_OFFERS_API,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      )
      const data: unknown = await response.json()
      if (!response.ok) {
        const payload = data as { message?: string; errors?: FormErrors }
        if (payload?.errors) setFormErrors(payload.errors)
        throw new Error(payload?.message ?? "The offer could not be saved.")
      }

      setDialogOpen(false)
      await loadOffers()
      toast.add({
        id: "save-offer",
        type: "success",
        title: editing ? "Offer updated" : "Offer created",
        description: editing
          ? "Your changes to this offer have been saved."
          : "The new offer has been added to your list.",
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "The offer could not be saved. Please try again."
      setFormError(message)
      toast.add({
        id: "save-offer",
        type: "error",
        title: "Offer not saved",
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (offer: Offer) => {
    setTogglingId(offer._id)
    setError(null)
    const toggleToastId = `toggle-offer-${offer._id}`
    toast.add({
      id: toggleToastId,
      type: "loading",
      title: offer.active ? "Deactivating offer…" : "Activating offer…",
      description: "Please wait while we update this offer.",
    })
    try {
      const response = await fetch(`${ADMIN_OFFERS_API}/${offer._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !offer.active }),
      })
      const data: unknown = await response.json()
      if (!response.ok) {
        const message =
          typeof (data as { message?: string })?.message === "string"
            ? (data as { message: string }).message
            : "The offer could not be updated."
        throw new Error(message)
      }

      setOffers((prev) =>
        prev.map((item) =>
          item._id === offer._id ? { ...item, active: !offer.active } : item
        )
      )
      toast.add({
        id: toggleToastId,
        type: "success",
        title: offer.active ? "Offer deactivated" : "Offer activated",
        description: offer.active
          ? "This offer is no longer visible to customers."
          : "This offer is now visible to customers.",
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "The offer could not be updated. Please try again."
      setError(message)
      toast.add({
        id: toggleToastId,
        type: "error",
        title: "Offer not updated",
        description: message,
      })
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    const offer = pendingDelete
    setDeleting(true)
    setError(null)
    const deleteToastId = "delete-offer"
    toast.add({
      id: deleteToastId,
      type: "loading",
      title: "Deleting offer…",
      description: "Please wait while we remove this offer.",
    })
    try {
      const response = await fetch(`${ADMIN_OFFERS_API}/${offer._id}`, {
        method: "DELETE",
      })
      const data: unknown = await response.json()
      if (!response.ok) {
        const message =
          typeof (data as { message?: string })?.message === "string"
            ? (data as { message: string }).message
            : "The offer could not be deleted."
        throw new Error(message)
      }

      setOffers((prev) => prev.filter((item) => item._id !== offer._id))
      setPendingDelete(null)
      toast.add({
        id: deleteToastId,
        type: "success",
        title: "Offer deleted",
        description: "The offer has been removed from your list.",
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "The offer could not be deleted. Please try again."
      setError(message)
      setPendingDelete(null)
      toast.add({
        id: deleteToastId,
        type: "error",
        title: "Offer not deleted",
        description: message,
      })
    } finally {
      setDeleting(false)
    }
  }

  /* --- access gate (the API re-enforces this server-side) --- */

  if (sessionPending) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-rose-500" aria-hidden />
          Checking your access…
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[.08] bg-zinc-50 px-6 py-16 text-center dark:border-white/[.12] dark:bg-zinc-900">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/15">
          <Ticket className="size-7 text-rose-500" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Admin access required</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          This page is only available to salon administrators. Your account is
          signed in as a customer.
        </p>
        <Button
          type="button"
          className="mt-4 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700"
          onClick={() => router.push("/dashboard/offers")}
        >
          View My Offers
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Manage Offers
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            Create, edit, activate or remove the discount offers customers see
            on their My Offers page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={loading}
            onClick={() => void loadOffers()}
          >
            {loading ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <RefreshCw aria-hidden />
            )}
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:bg-rose-700"
            onClick={openCreate}
          >
            <Plus aria-hidden />
            New Offer
          </Button>
        </div>
      </div>

      {error && !loading ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {error}
          </span>
          <Button variant="outline" size="sm" onClick={() => void loadOffers()}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[.08] bg-zinc-50 px-6 py-16 text-center dark:border-white/[.12] dark:bg-zinc-900">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/15">
            <Tags className="size-7 text-rose-500" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No offers yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create your first offer and it will appear on your customers&apos;
            My Offers page right away.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700"
            onClick={openCreate}
          >
            <Plus aria-hidden />
            Create Offer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const expired = isOfferExpired(offer.expiryDate)
            const busy = togglingId === offer._id
            return (
              <Card
                key={offer._id}
                className="group h-full overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-500 to-pink-500 px-5 py-5 text-white">
                  <div
                    aria-hidden="true"
                    className="absolute -right-6 -top-8 size-28 rounded-full bg-white/15"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-10 -left-6 size-24 rounded-full bg-white/10"
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                      <Percent className="size-3.5" aria-hidden />
                      {formatDiscountLabel(
                        offer.discountType,
                        offer.discountValue
                      )}
                    </span>
                    <StatusBadges offer={offer} />
                  </div>

                  <h2 className="relative mt-3 text-lg font-semibold leading-snug">
                    {offer.title}
                  </h2>
                </div>

                <CardHeader className="gap-2 pb-2">
                  <CardTitle className="sr-only">{offer.title}</CardTitle>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {offer.description}
                  </p>
                </CardHeader>

                <CardContent className="flex flex-col gap-2.5 pt-0 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-rose-300 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-950/30">
                    <span className="truncate font-mono text-sm font-bold tracking-widest text-rose-600 dark:text-rose-400">
                      {offer.couponCode || "—"}
                    </span>
                    <Badge className="shrink-0 border border-white/40 bg-white/90 text-rose-600 hover:bg-white dark:bg-zinc-900/90 dark:text-rose-400">
                      {offer.applicableService || "All services"}
                    </Badge>
                  </div>

                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-3.5 text-rose-500" aria-hidden />
                    Expires {formatExpiryDate(offer.expiryDate)}
                    {expired ? " (expired)" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Ticket className="size-3.5 text-rose-500" aria-hidden />
                    {offer.minBookingAmount > 0
                      ? `Min. booking $${offer.minBookingAmount}`
                      : "No minimum booking amount"}
                  </span>
                </CardContent>

                <CardFooter className="mt-auto flex-wrap justify-between gap-2 border-t border-black/[.06] pt-3 dark:border-white/[.08]">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={busy}
                    onClick={() => void handleToggle(offer)}
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : offer.active ? (
                      <EyeOff aria-hidden />
                    ) : (
                      <Eye aria-hidden />
                    )}
                    {offer.active ? "Deactivate" : "Activate"}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => openEdit(offer)}
                    >
                      <Pencil aria-hidden />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      onClick={() => setPendingDelete(offer)}
                    >
                      <Trash2 aria-hidden />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* --- create / edit dialog --- */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Offer" : "Create Offer"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the offer details. Customers see changes immediately."
                : "Fill in the details — the offer appears on My Offers once created."}
            </DialogDescription>
          </DialogHeader>

          {formError ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="offer-title">Offer title</FieldLabel>
                <Input
                  id="offer-title"
                  name="title"
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="e.g. Festive Season Sale"
                  aria-invalid={formErrors.title ? true : undefined}
                />
                {formErrors.title ? (
                  <p className="text-sm text-destructive">{formErrors.title}</p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="offer-description">Description</FieldLabel>
                <Textarea
                  id="offer-description"
                  name="description"
                  value={form.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  placeholder="What makes this offer attractive to customers?"
                  rows={3}
                  aria-invalid={formErrors.description ? true : undefined}
                />
                {formErrors.description ? (
                  <p className="text-sm text-destructive">
                    {formErrors.description}
                  </p>
                ) : null}
              </Field>

              {/* Discount type: percentage or fixed amount */}
              <Field>
                <FieldLabel>Discount type</FieldLabel>
                <RadioGroup
                  value={form.discountType}
                  onValueChange={(value) =>
                    setField("discountType", value as OfferFormValues["discountType"])
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  <FieldLabel htmlFor="discount-percentage">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Percentage (%)</FieldTitle>
                      </FieldContent>
                      <RadioGroupItem
                        value="percentage"
                        id="discount-percentage"
                      />
                    </Field>
                  </FieldLabel>

                  <FieldLabel htmlFor="discount-fixed">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Fixed amount ($)</FieldTitle>
                      </FieldContent>
                      <RadioGroupItem value="fixed" id="discount-fixed" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
                {formErrors.discountType ? (
                  <p className="text-sm text-destructive">
                    {formErrors.discountType}
                  </p>
                ) : null}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="discount-value">
                    Discount value
                  </FieldLabel>
                  <Input
                    id="discount-value"
                    name="discountValue"
                    type="number"
                    min={0}
                    step="any"
                    value={form.discountValue}
                    onChange={(event) =>
                      setField("discountValue", event.target.value)
                    }
                    placeholder={
                      form.discountType === "fixed" ? "e.g. 500" : "e.g. 20"
                    }
                    aria-invalid={formErrors.discountValue ? true : undefined}
                  />
                  {formErrors.discountValue ? (
                    <p className="text-sm text-destructive">
                      {formErrors.discountValue}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="coupon-code">Coupon code</FieldLabel>
                  <Input
                    id="coupon-code"
                    name="couponCode"
                    value={form.couponCode}
                    onChange={(event) =>
                      setField(
                        "couponCode",
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g. GLOW20"
                    aria-invalid={formErrors.couponCode ? true : undefined}
                  />
                  {formErrors.couponCode ? (
                    <p className="text-sm text-destructive">
                      {formErrors.couponCode}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="applicable-service">
                    Applicable service / category
                  </FieldLabel>
                  <Input
                    id="applicable-service"
                    name="applicableService"
                    value={form.applicableService}
                    onChange={(event) =>
                      setField("applicableService", event.target.value)
                    }
                    placeholder="e.g. Hair Coloring or All services"
                    aria-invalid={
                      formErrors.applicableService ? true : undefined
                    }
                  />
                  {formErrors.applicableService ? (
                    <p className="text-sm text-destructive">
                      {formErrors.applicableService}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="expiry-date">Expiry date</FieldLabel>
                  <Input
                    id="expiry-date"
                    name="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={(event) =>
                      setField("expiryDate", event.target.value)
                    }
                    aria-invalid={formErrors.expiryDate ? true : undefined}
                  />
                  {formErrors.expiryDate ? (
                    <p className="text-sm text-destructive">
                      {formErrors.expiryDate}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="min-booking">
                    Minimum booking amount
                  </FieldLabel>
                  <Input
                    id="min-booking"
                    name="minBookingAmount"
                    type="number"
                    min={0}
                    step="any"
                    value={form.minBookingAmount}
                    onChange={(event) =>
                      setField("minBookingAmount", event.target.value)
                    }
                    placeholder="e.g. 1000 (optional)"
                    aria-invalid={
                      formErrors.minBookingAmount ? true : undefined
                    }
                  />
                  {formErrors.minBookingAmount ? (
                    <p className="text-sm text-destructive">
                      {formErrors.minBookingAmount}
                    </p>
                  ) : null}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="offer-terms">
                  Terms and conditions
                </FieldLabel>
                <Textarea
                  id="offer-terms"
                  name="terms"
                  value={form.terms}
                  onChange={(event) => setField("terms", event.target.value)}
                  placeholder="e.g. Valid on all services above the minimum booking amount. Cannot be combined with other offers."
                  rows={3}
                  aria-invalid={formErrors.terms ? true : undefined}
                />
                {formErrors.terms ? (
                  <p className="text-sm text-destructive">{formErrors.terms}</p>
                ) : null}
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : editing ? (
                  "Save Changes"
                ) : (
                  "Create Offer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- delete confirmation --- */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.title}" will be permanently removed and customers will no longer see it. This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Keep Offer
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Yes, Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminOffersPage
