"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Mail,
  RefreshCw,
  Search,
  Tag,
  UserRound,
} from "lucide-react"

import { authClient } from "@/app/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const REPORTS_API = "/api/admin/reports"
const STATUSES = ["pending", "reviewed", "resolved"] as const
type ReportStatus = (typeof STATUSES)[number]

type Report = {
  id: string
  userId: string
  customerName: string
  customerEmail: string
  category: string
  subject: string
  relatedService: string
  appointmentId: string
  description: string
  submittedAt: string
  status: string
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function firstText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" || typeof value === "number") {
      return String(value)
    }
  }
  return ""
}

function normalizeReport(value: unknown): Report | null {
  const record = recordOf(value)
  if (!record) return null

  return {
    id: firstText(record, ["_id", "id", "reportId"]),
    userId: firstText(record, ["userId"]),
    customerName: firstText(record, ["customerName"]),
    customerEmail: firstText(record, ["customerEmail"]),
    category: firstText(record, ["category"]),
    subject: firstText(record, ["subject"]),
    relatedService: firstText(record, ["relatedService"]),
    appointmentId: firstText(record, ["appointmentId"]),
    description: firstText(record, ["description"]),
    submittedAt: firstText(record, ["submittedAt", "createdAt", "created_at"]),
    status: firstText(record, ["status"]),
  }
}

function statusKey(status: string): ReportStatus | null {
  const normalized = status.trim().toLowerCase()
  return STATUSES.find((candidate) => candidate === normalized) ?? null
}

function isReportStatus(value: string | null): value is ReportStatus {
  return value !== null && STATUSES.some((status) => status === value)
}

function formatStatus(status: string) {
  const key = statusKey(status)
  if (!key) return status || "Unknown"
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function formatDate(value: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date)
}

function StatusBadge({ status }: { status: string }) {
  const key = statusKey(status)
  const color =
    key === "pending"
      ? "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : key === "reviewed"
        ? "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
        : key === "resolved"
          ? "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-transparent bg-muted text-muted-foreground"

  return (
    <Badge className={`gap-1.5 ${color}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {formatStatus(status)}
    </Badge>
  )
}

function StatusSelect({
  report,
  disabled,
  onChange,
}: {
  report: Report
  disabled: boolean
  onChange: (report: Report, status: ReportStatus) => void
}) {
  const currentStatus = statusKey(report.status)

  return (
    <Select
      value={currentStatus ?? ""}
      onValueChange={(value) => {
        if (isReportStatus(value) && value !== currentStatus) {
          onChange(report, value)
        }
      }}
      disabled={disabled || !report.id}
    >
      <SelectTrigger aria-label={`Update status for ${report.subject}`} className="w-full min-w-32">
        <SelectValue placeholder="Set status" />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {formatStatus(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: number
  icon: typeof FileText
  accent: string
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex-row items-center justify-between gap-3 px-4 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className={`rounded-lg p-2 ${accent}`}>
          <Icon className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function ManageReportsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const isAdmin = role === "admin"

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchReports = useCallback(async (): Promise<Report[]> => {
    const response = await fetch(REPORTS_API, { cache: "no-store" })
    const data: unknown = await response.json()

    if (!response.ok) {
      const payload = recordOf(data)
      throw new Error(
        typeof payload?.message === "string"
          ? payload.message
          : "Reports could not be loaded."
      )
    }

    const payload = recordOf(data)
    const items = Array.isArray(data)
      ? data
      : Array.isArray(payload?.reports)
        ? payload.reports
        : null

    if (!items) {
      throw new Error("The reports service returned an unexpected response.")
    }

    return items
      .map(normalizeReport)
      .filter((report): report is Report => report !== null)
  }, [])

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReports(await fetchReports())
    } catch (err) {
      setReports([])
      setError(
        err instanceof Error
          ? err.message
          : "Reports could not be loaded. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }, [fetchReports])

  useEffect(() => {
    if (sessionPending || !isAdmin) return

    let active = true
    fetchReports()
      .then((data) => {
        if (!active) return
        setReports(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setReports([])
        setError(
          err instanceof Error
            ? err.message
            : "Reports could not be loaded. Please try again."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [sessionPending, isAdmin, fetchReports])

  const categories = useMemo(
    () =>
      [...new Set(reports.map((report) => report.category).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [reports]
  )

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase()
    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        [report.customerName, report.customerEmail, report.subject].some((value) =>
          value.toLowerCase().includes(query)
        )
      const matchesCategory =
        categoryFilter === "all" || report.category === categoryFilter
      const matchesStatus =
        statusFilter === "all" || statusKey(report.status) === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [reports, search, categoryFilter, statusFilter])

  const summary = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((report) => statusKey(report.status) === "pending").length,
      reviewed: reports.filter((report) => statusKey(report.status) === "reviewed").length,
      resolved: reports.filter((report) => statusKey(report.status) === "resolved").length,
    }),
    [reports]
  )

  const updateStatus = async (report: Report, status: ReportStatus) => {
    setUpdatingId(report.id)
    setError(null)
    try {
      const response = await fetch(
        `${REPORTS_API}/${encodeURIComponent(report.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      )
      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const payload = recordOf(data)
        throw new Error(
          typeof payload?.message === "string"
            ? payload.message
            : "The report status could not be updated."
        )
      }

      setReports((current) =>
        current.map((item) =>
          item.id === report.id ? { ...item, status } : item
        )
      )
      setSelectedReport((current) =>
        current?.id === report.id ? { ...current, status } : current
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The report status could not be updated. Please try again."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  if (sessionPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div
        role="alert"
        className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center"
      >
        <AlertCircle className="size-6 text-destructive" aria-hidden />
        <h1 className="font-semibold">Admin access required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Sign in with an administrator account to manage customer reports.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Manage Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review customer feedback and keep each report moving forward.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadReports}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Reports"
          value={summary.total}
          icon={FileText}
          accent="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
        />
        <SummaryCard
          title="Pending Reports"
          value={summary.pending}
          icon={Clock3}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        />
        <SummaryCard
          title="Reviewed Reports"
          value={summary.reviewed}
          icon={Eye}
          accent="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
        />
        <SummaryCard
          title="Resolved Reports"
          value={summary.resolved}
          icon={CheckCircle2}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            disabled={loading}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Try again
          </Button>
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">All reports</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? "Loading reports…"
                  : `${filteredReports.length} of ${reports.length} reports`}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:flex">
              <div className="relative sm:col-span-2 lg:w-64">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, subject"
                  aria-label="Search reports"
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? "all")}>
                <SelectTrigger aria-label="Filter by category" className="w-full lg:w-44">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
                <SelectTrigger aria-label="Filter by status" className="w-full lg:w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {loading ? (
          <div className="space-y-3 p-4 sm:p-5" aria-label="Loading reports">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error && reports.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Reports are unavailable right now.
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <span className="rounded-full bg-muted p-3">
              <FileText className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <h2 className="font-medium">
              {reports.length === 0 ? "No reports yet" : "No matching reports"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {reports.length === 0
                ? "Customer reports will appear here when they are submitted."
                : "Try changing the search or filters to find a report."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Report ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id || `${report.subject}-${report.submittedAt}`}>
                      <TableCell className="max-w-32 truncate font-mono text-xs text-muted-foreground">
                        {report.id || "—"}
                      </TableCell>
                      <TableCell className="min-w-32 font-medium">
                        {report.customerName || "—"}
                      </TableCell>
                      <TableCell className="min-w-48 text-muted-foreground">
                        {report.customerEmail || "—"}
                      </TableCell>
                      <TableCell className="min-w-36">{report.category || "—"}</TableCell>
                      <TableCell className="min-w-44 max-w-56 truncate font-medium">
                        {report.subject || "—"}
                      </TableCell>
                      <TableCell className="min-w-48 max-w-64 truncate text-muted-foreground">
                        {report.description || "—"}
                      </TableCell>
                      <TableCell className="min-w-32">
                        {formatDate(report.submittedAt)}
                      </TableCell>
                      <TableCell className="min-w-36">
                        <div className="flex flex-col items-start gap-2">
                          <StatusBadge status={report.status} />
                          <StatusSelect
                            report={report}
                            disabled={updatingId !== null}
                            onChange={updateStatus}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="size-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filteredReports.map((report) => (
                <article
                  key={report.id || `${report.subject}-${report.submittedAt}`}
                  className="space-y-3 rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {report.subject || "Untitled report"}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {report.customerName || "Unknown customer"} · {report.customerEmail || "No email"}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Report ID</p>
                      <p className="mt-0.5 truncate font-mono">{report.id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="mt-0.5 truncate">{report.category || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="mt-0.5">{formatDate(report.submittedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Description</p>
                      <p className="mt-0.5 line-clamp-2">
                        {report.description || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <StatusSelect
                      report={report}
                      disabled={updatingId !== null}
                      onChange={updateStatus}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="size-4" />
                      View details
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={selectedReport !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>Report details</DialogTitle>
                <DialogDescription>
                  Full information submitted by the customer.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <DetailItem icon={FileText} label="Report ID" value={selectedReport.id || "—"} />
                <DetailItem icon={CalendarDays} label="Submitted" value={formatDate(selectedReport.submittedAt)} />
                <DetailItem icon={UserRound} label="Customer" value={selectedReport.customerName || "—"} />
                <DetailItem icon={Mail} label="Customer email" value={selectedReport.customerEmail || "—"} />
                <DetailItem icon={Tag} label="Category" value={selectedReport.category || "—"} />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <DetailItem icon={FileText} label="Subject" value={selectedReport.subject || "—"} />
                {selectedReport.userId && (
                  <DetailItem icon={UserRound} label="Customer ID" value={selectedReport.userId} />
                )}
                {selectedReport.relatedService && (
                  <DetailItem icon={Tag} label="Related service" value={selectedReport.relatedService} />
                )}
                {selectedReport.appointmentId && (
                  <DetailItem icon={CalendarDays} label="Appointment ID" value={selectedReport.appointmentId} />
                )}
                <div className="space-y-1.5 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-3 text-sm leading-6">
                    {selectedReport.description || "No description provided."}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-words text-sm">{value}</p>
      </div>
    </div>
  )
}