"use client"

import * as React from "react"

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  EMPTY_REPORT_FORM,
  ISSUE_CATEGORIES,
  sanitizeReportForm,
  validateReportForm,
  type ReportFormValues,
} from "@/lib/reports"

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export default function ReportIssuePage() {
  const [values, setValues] = React.useState<ReportFormValues>(
    EMPTY_REPORT_FORM
  )
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [submitState, setSubmitState] = React.useState<SubmitState>({
    status: "idle",
  })

  const submitting = submitState.status === "submitting"

  function updateField<K extends keyof ReportFormValues>(
    field: K,
    value: ReportFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const sanitized = sanitizeReportForm(values)
    const errors = validateReportForm(sanitized)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSubmitState({
        status: "error",
        message: "Please fix the highlighted fields and try again.",
      })
      return
    }

    setFieldErrors({})
    setSubmitState({ status: "submitting" })

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      })

      const data = (await response.json().catch(() => null)) as {
        message?: string
        errors?: Record<string, string>
      } | null

      if (!response.ok) {
        if (data?.errors) setFieldErrors(data.errors)
        setSubmitState({
          status: "error",
          message:
            data?.message ??
            "Your report could not be submitted. Please try again.",
        })
        return
      }

      setValues(EMPTY_REPORT_FORM)
      setSubmitState({
        status: "success",
        message:
          data?.message ??
          "Your report has been submitted. Our team will review it shortly.",
      })
    } catch {
      setSubmitState({
        status: "error",
        message:
          "Something went wrong while submitting your report. Please check your connection and try again.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Report an Issue
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Facing a problem with a service or booking? Tell us what happened and
          our team will look into it.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Submit a report</CardTitle>
          <CardDescription>
            Fields marked as required must be filled in before you can submit.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitState.status === "success" && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{submitState.message}</span>
            </div>
          )}

          {submitState.status === "error" && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{submitState.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field data-invalid={fieldErrors.category ? true : undefined}>
                <FieldLabel htmlFor="issue-category">Issue Category</FieldLabel>
                <Select
                  value={values.category || undefined}
                  onValueChange={(value) =>
                    updateField("category", value ?? "")
                  }
                >
                  <SelectTrigger
                    id="issue-category"
                    className="w-full"
                    aria-invalid={fieldErrors.category ? true : undefined}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.category && (
                  <FieldError>{fieldErrors.category}</FieldError>
                )}
              </Field>

              <Field data-invalid={fieldErrors.subject ? true : undefined}>
                <FieldLabel htmlFor="issue-subject">Subject</FieldLabel>
                <Input
                  id="issue-subject"
                  name="subject"
                  placeholder="Brief summary of the issue"
                  value={values.subject}
                  onChange={(event) =>
                    updateField("subject", event.target.value)
                  }
                  aria-invalid={fieldErrors.subject ? true : undefined}
                />
                {fieldErrors.subject ? (
                  <FieldError>{fieldErrors.subject}</FieldError>
                ) : (
                  <FieldDescription>
                    A short title that describes the problem.
                  </FieldDescription>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  data-invalid={
                    fieldErrors.relatedService ? true : undefined
                  }
                >
                  <FieldLabel htmlFor="issue-service">
                    Related Service{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    id="issue-service"
                    name="relatedService"
                    placeholder="e.g. Haircut & Styling"
                    value={values.relatedService}
                    onChange={(event) =>
                      updateField("relatedService", event.target.value)
                    }
                    aria-invalid={
                      fieldErrors.relatedService ? true : undefined
                    }
                  />
                  {fieldErrors.relatedService && (
                    <FieldError>{fieldErrors.relatedService}</FieldError>
                  )}
                </Field>

                <Field
                  data-invalid={fieldErrors.appointmentId ? true : undefined}
                >
                  <FieldLabel htmlFor="issue-appointment">
                    Appointment ID{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    id="issue-appointment"
                    name="appointmentId"
                    placeholder="e.g. 665f1c2e8b3e4a0012ab34cd"
                    value={values.appointmentId}
                    onChange={(event) =>
                      updateField("appointmentId", event.target.value)
                    }
                    aria-invalid={
                      fieldErrors.appointmentId ? true : undefined
                    }
                  />
                  {fieldErrors.appointmentId && (
                    <FieldError>{fieldErrors.appointmentId}</FieldError>
                  )}
                </Field>
              </div>

              <Field
                data-invalid={fieldErrors.description ? true : undefined}
              >
                <FieldLabel htmlFor="issue-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="issue-description"
                  name="description"
                  rows={6}
                  placeholder="Explain what happened in detail…"
                  value={values.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  aria-invalid={fieldErrors.description ? true : undefined}
                />
                {fieldErrors.description ? (
                  <FieldError>{fieldErrors.description}</FieldError>
                ) : (
                  <FieldDescription>
                    Include dates, staff names, or booking details if relevant.
                  </FieldDescription>
                )}
              </Field>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send aria-hidden />
                    Submit Report
                  </>
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
