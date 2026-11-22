"use client";

import { useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const APPOINTMENTS_API = "/api/admin/appointments";

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(APPOINTMENTS_API, { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data?.appointments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>
      {error && <p className="text-destructive">{error}</p>}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Appointment Date</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Currency</th>
                <th className="text-left p-2">Payment Status</th>
                <th className="text-left p-2">Stripe Session ID</th>
                <th className="text-left p-2">Paid At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{a.customerName}</td>
                  <td className="p-2">{a.serviceName}</td>
                  <td className="p-2">{a.date || a.appointmentDate}</td>
                  <td className="p-2">{a.paymentAmount || a.price}</td>
                  <td className="p-2">{a.currency || "USD"}</td>
                  <td className="p-2">{a.paymentStatus}</td>
                  <td className="p-2">{(a.stripeSessionId || a.sessionId || a.checkoutSessionId || "").slice(-8)}</td>
                  <td className="p-2">{a.paidAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
