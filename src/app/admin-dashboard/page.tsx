"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, CreditCard, Scissors, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    customers: 0,
    services: 0,
    appointments: 0,
    pending: 0,
    confirmed: 0,
    payments: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [apptRes, svcRes] = await Promise.all([
          fetch("/api/admin/appointments", { cache: "no-store" }),
          fetch("http://localhost:8000/services", { cache: "no-store" }),
        ]);
        const appts = await apptRes.json();
        const svcs = await svcRes.json();
        const aList = Array.isArray(appts) ? appts : appts?.appointments ?? [];
        const sList = Array.isArray(svcs) ? svcs : [];
        const emails = new Set(aList.map((a: any) => a.customerEmail).filter(Boolean));
        setStats({
          customers: emails.size,
          services: sList.length,
          appointments: aList.length,
          pending: aList.filter((a: any) => a.status === "pending").length,
          confirmed: aList.filter((a: any) => a.status === "confirmed").length,
          payments: aList.filter((a: any) => a.paymentStatus === "paid").length,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: "Total Registered Customers", value: stats.customers, icon: Users },
    { label: "Total Active Services", value: stats.services, icon: Scissors },
    { label: "Total Appointment Requests", value: stats.appointments, icon: CalendarDays },
    { label: "Pending Appointments", value: stats.pending, icon: CalendarDays },
    { label: "Confirmed Appointments", value: stats.confirmed, icon: CheckCircle2 },
    { label: "Total Successful Payments", value: stats.payments, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{c.label}</CardTitle>
              <c.icon className="size-4" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{c.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
