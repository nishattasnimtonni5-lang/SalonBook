/**
 * Shared constants, types and validation for the Offers feature.
 * Used by the customer "My Offers" page, the admin management page and
 * the server-side /api/admin/offers routes.
 */

export type OfferDiscountType = "percentage" | "fixed"

export const OFFER_DISCOUNT_TYPES: readonly OfferDiscountType[] = [
  "percentage",
  "fixed",
] as const

export type OfferFormValues = {
  title: string
  description: string
  discountType: OfferDiscountType | ""
  discountValue: string
  applicableService: string
  couponCode: string
  expiryDate: string
  minBookingAmount: string
  terms: string
}

/** A stored offer as returned by the Express API. */
export type Offer = {
  _id: string
  title: string
  description: string
  discountType: OfferDiscountType
  discountValue: number
  applicableService: string
  couponCode: string
  expiryDate: string
  minBookingAmount: number
  terms: string
  active: boolean
  createdAt: string
  status?: "active" | "inactive" | string
  promoCode?: string
  image?: string
  category?: string
}

export const OFFER_VALIDATION = {
  titleMin: 3,
  titleMax: 150,
  descriptionMin: 5,
  descriptionMax: 2000,
  discountValueMax: 100000,
  couponMax: 40,
  applicableServiceMax: 120,
  termsMax: 1500,
} as const

export const EMPTY_OFFER_FORM: OfferFormValues = {
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  applicableService: "",
  couponCode: "",
  expiryDate: "",
  minBookingAmount: "",
  terms: "",
}

/** Coerce a form value to a trimmed string (numbers from JSON are OK). */
function asTrimmedString(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return ""
}

/** Trim every value so validation and storage work on clean input. */
export function sanitizeOfferForm(
  values: Partial<OfferFormValues>
): OfferFormValues {
  const discountType =
    values.discountType === "percentage" || values.discountType === "fixed"
      ? values.discountType
      : ""
  return {
    title: asTrimmedString(values.title),
    description: asTrimmedString(values.description),
    discountType,
    discountValue: asTrimmedString(values.discountValue),
    applicableService: asTrimmedString(values.applicableService),
    couponCode: asTrimmedString(values.couponCode),
    expiryDate: asTrimmedString(values.expiryDate),
    minBookingAmount: asTrimmedString(values.minBookingAmount),
    terms: asTrimmedString(values.terms),
  }
}

function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime())
}

/**
 * Validate a (sanitized) offer form. Returns a map of field -> error
 * message; an empty object means the form is valid.
 */
export function validateOfferForm(
  values: OfferFormValues
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!values.title) {
    errors.title = "Offer title is required."
  } else if (values.title.length < OFFER_VALIDATION.titleMin) {
    errors.title = `Title must be at least ${OFFER_VALIDATION.titleMin} characters.`
  } else if (values.title.length > OFFER_VALIDATION.titleMax) {
    errors.title = `Title must be ${OFFER_VALIDATION.titleMax} characters or fewer.`
  }

  if (!values.description) {
    errors.description = "Description is required."
  } else if (values.description.length < OFFER_VALIDATION.descriptionMin) {
    errors.description = `Description must be at least ${OFFER_VALIDATION.descriptionMin} characters.`
  } else if (values.description.length > OFFER_VALIDATION.descriptionMax) {
    errors.description = `Description must be ${OFFER_VALIDATION.descriptionMax} characters or fewer.`
  }

  if (
    values.discountType !== "percentage" &&
    values.discountType !== "fixed"
  ) {
    errors.discountType = "Choose percentage or fixed amount."
  }

  const discountValue = Number(values.discountValue)
  if (!values.discountValue) {
    errors.discountValue = "Discount value is required."
  } else if (!Number.isFinite(discountValue) || discountValue <= 0) {
    errors.discountValue = "Discount value must be greater than 0."
  } else if (
    values.discountType === "percentage" &&
    discountValue > 100
  ) {
    errors.discountValue = "Percentage discount cannot exceed 100."
  } else if (discountValue > OFFER_VALIDATION.discountValueMax) {
    errors.discountValue = "Discount value is too large."
  }

  if (values.couponCode.length > OFFER_VALIDATION.couponMax) {
    errors.couponCode = `Coupon code must be ${OFFER_VALIDATION.couponMax} characters or fewer.`
  }

  if (
    values.applicableService.length >
    OFFER_VALIDATION.applicableServiceMax
  ) {
    errors.applicableService = `Applicable service must be ${OFFER_VALIDATION.applicableServiceMax} characters or fewer.`
  }

  if (!values.expiryDate) {
    errors.expiryDate = "Expiry date is required."
  } else if (!isDateOnly(values.expiryDate)) {
    errors.expiryDate = "Choose a valid expiry date."
  }

  if (values.minBookingAmount) {
    const min = Number(values.minBookingAmount)
    if (!Number.isFinite(min) || min < 0) {
      errors.minBookingAmount = "Minimum booking amount must be 0 or more."
    }
  }

  if (values.terms.length > OFFER_VALIDATION.termsMax) {
    errors.terms = `Terms must be ${OFFER_VALIDATION.termsMax} characters or fewer.`
  }

  return errors
}

/** "20% OFF" / "$5 OFF" — used on customer and admin cards. */
export function formatDiscountLabel(
  type: OfferDiscountType,
  value: number
): string {
  if (type === "percentage") return `${value}% OFF`
  return `$${value} OFF`
}

/** Today as "YYYY-MM-DD" (server/UTC, matches how expiry dates are stored). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isOfferExpired(expiryDate: string): boolean {
  return Boolean(expiryDate) && expiryDate < todayIso()
}

/** Customer-visible offers are switched on and not past their expiry. */
export function isOfferVisible(offer: Pick<Offer, "active" | "expiryDate">) {
  return offer.active && !isOfferExpired(offer.expiryDate)
}

export function formatExpiryDate(value: string): string {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Normalize a raw `/offers` payload into well-formed Offer objects,
 * tolerating both the Express shape (couponCode/applicableService/active)
 * and the admin form shape (promoCode/category/status). Malformed entries
 * are dropped so callers only ever render valid records.
 */
export function filterValidOffers(data: unknown): Offer[] {
  if (!Array.isArray(data)) return []
  return data.flatMap((item) => {
    if (typeof item !== "object" || item === null) return []

    const record = item as Record<string, unknown>
    if (typeof record._id !== "string" || typeof record.title !== "string") {
      return []
    }

    const status =
      typeof record.status === "string"
        ? record.status
        : typeof record.active === "boolean"
          ? record.active
            ? "active"
            : "inactive"
          : "inactive"

    return [{
      _id: record._id,
      title: record.title,
      description: typeof record.description === "string" ? record.description : "",
      discountType:
        record.discountType === "fixed" ? "fixed" : "percentage",
      discountValue:
        typeof record.discountValue === "number" ? record.discountValue : 0,
      applicableService:
        typeof record.applicableService === "string"
          ? record.applicableService
          : typeof record.category === "string"
            ? record.category
            : "All services",
      couponCode:
        typeof record.couponCode === "string"
          ? record.couponCode
          : typeof record.promoCode === "string"
            ? record.promoCode
            : "",
      expiryDate: typeof record.expiryDate === "string" ? record.expiryDate : "",
      minBookingAmount:
        typeof record.minBookingAmount === "number" ? record.minBookingAmount : 0,
      terms: typeof record.terms === "string" ? record.terms : "",
      active: status === "active",
      createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
      status,
      promoCode:
        typeof record.promoCode === "string"
          ? record.promoCode
          : typeof record.couponCode === "string"
            ? record.couponCode
            : "",
      image: typeof record.image === "string" ? record.image : undefined,
      category: typeof record.category === "string" ? record.category : undefined,
    }]
  })
}
