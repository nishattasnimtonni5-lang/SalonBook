"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/app/lib/api/config";
import { Button } from "@/components/ui/button";

type Transaction = {
  _id: string;
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  paymentAmount: number;
  currency: string;
  paymentStatus: string;
  transactionDate?: string;
};

export default function UserTransactionsPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE_URL}/admin/users/${userId}/transactions`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || "Failed to load user transactions"
          );
        }

        setTransactions(
          Array.isArray(data) ? data : data.transactions || []
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  if (loading) {
    return <p className="p-6">Loading transactions...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-red-500">{error}</p>
        <Button render={<Link href="/admin/users" />}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Transactions</h1>
          <p className="mt-2 text-gray-500">
            Booking and payment history of this user.
          </p>
        </div>

        <Button variant="outline" render={<Link href="/admin/users" />}>
          Back to Users
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">
          Total Transactions: {transactions.length}
        </h2>

        {transactions.length === 0 ? (
          <p className="py-10 text-center text-gray-500">
            No transactions found for this user.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="p-3">Service</th>
                  <th className="p-3">Appointment Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Transaction Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="border-b last:border-0"
                  >
                    <td className="p-3 font-medium">
                      {transaction.serviceName || "—"}
                    </td>

                    <td className="p-3">
                      {transaction.appointmentDate || "—"}
                    </td>

                    <td className="p-3">
                      {transaction.appointmentTime || "—"}
                    </td>

                    <td className="p-3">
                      {transaction.currency || "USD"}{" "}
                      {transaction.paymentAmount ?? 0}
                    </td>

                    <td className="p-3">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        {transaction.paymentStatus || "—"}
                      </span>
                    </td>

                    <td className="p-3">
                      {transaction.transactionDate
                        ? new Date(
                            transaction.transactionDate
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}