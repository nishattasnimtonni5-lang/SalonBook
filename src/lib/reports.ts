/**
 * Shared constants and validation for the "Report an Issue" feature.
 * Used by both the dashboard form (client) and the /api/reports route (server).
 */

export const ISSUE_CATEGORIES = [
  "Service Quality",
  "Staff Behaviour",
  "Payment Issue",
  "Booking Issue",
  "Inappropriate Behaviour / Abuse",
  "Other",
] as const

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]

export type ReportFormValues = {
  category: string
  subject: string
  relatedService: string
  appointmentId: string
  description: string
}

export const REPORT_VALIDATION = {
  subjectMin: 3,
  subjectMax: 200,
  descriptionMin: 10,
  descriptionMax: 5000,
  relatedServiceMax: 200,
  appointmentIdMax: 100,
} as const

export const EMPTY_REPORT_FORM: ReportFormValues = {
  category: "",
  subject: "",
  relatedService: "",
  appointmentId: "",
  description: "",
}

/** Trim every value so both validation and storage work on clean input. */
export function sanitizeReportForm(
  values: Partial<ReportFormValues>
): ReportFormValues {
  return {
    category: (values.category ?? "").trim(),
    subject: (values.subject ?? "").trim(),
    relatedService: (values.relatedService ?? "").trim(),
    appointmentId: (values.appointmentId ?? "").trim(),
    description: (values.description ?? "").trim(),
  }
}

/**
 * Validate the report form. Returns a map of field name -> error message.
 * An empty object means the form is valid.
 */
export function validateReportForm(
  values: ReportFormValues
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!values.category) {
    errors.category = "Choose an issue category."
  } else if (
    !(ISSUE_CATEGORIES as readonly string[]).includes(values.category)
  ) {
    errors.category = "Choose a valid issue category."
  }

  if (!values.subject) {
    errors.subject = "Subject is required."
  } else if (values.subject.length < REPORT_VALIDATION.subjectMin) {
    errors.subject = `Subject must be at least ${REPORT_VALIDATION.subjectMin} characters.`
  } else if (values.subject.length > REPORT_VALIDATION.subjectMax) {
    errors.subject = `Subject must be ${REPORT_VALIDATION.subjectMax} characters or fewer.`
  }

  if (!values.description) {
    errors.description = "Description is required."
  } else if (values.description.length < REPORT_VALIDATION.descriptionMin) {
    errors.description = `Description must be at least ${REPORT_VALIDATION.descriptionMin} characters.`
  } else if (values.description.length > REPORT_VALIDATION.descriptionMax) {
    errors.description = `Description must be ${REPORT_VALIDATION.descriptionMax} characters or fewer.`
  }

  if (values.relatedService.length > REPORT_VALIDATION.relatedServiceMax) {
    errors.relatedService = `Related service must be ${REPORT_VALIDATION.relatedServiceMax} characters or fewer.`
  }

  if (values.appointmentId.length > REPORT_VALIDATION.appointmentIdMax) {
    errors.appointmentId = `Appointment ID must be ${REPORT_VALIDATION.appointmentIdMax} characters or fewer.`
  }

  return errors
}
