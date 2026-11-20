import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your salon operations from one place.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to your dashboard</CardTitle>
          <CardDescription>
            Choose a section from the sidebar to manage salon services, bookings,
            offers, and customer reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your selected section will appear here while the admin dashboard
          navigation stays available.
        </CardContent>
      </Card>
    </div>
  )
}
