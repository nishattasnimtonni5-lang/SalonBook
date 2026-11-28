"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE_URL } from "@/app/lib/api/config";

type Transaction = {
  _id?: string;
  transactionId?: string;
  serviceName?: string;
  service?: string;
  amount?: number;
  price?: number;
  paymentStatus?: string;
  status?: string;
  createdAt?: string;
  date?: string;
};

export default function UserTransactionsPage() {
  const params = useParams();
  const router = useRouter();

  const userId = params.id as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/transactions`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load user transactions.");
      }

      const data = await response.json();

      const transactionList = Array.isArray(data)
        ? data
        : data.transactions || [];

      setTransactions(transactionList);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            className="mb-3 -ml-3"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>

          <h1 className="text-2xl font-bold">
            User Transactions
          </h1>

          <p className="mt-2 break-all text-sm text-muted-foreground">
            User ID: {userId}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchTransactions}
          disabled={loading}
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-10 text-center">
            Loading transactions...
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-red-500">{error}</p>

            <Button onClick={fetchTransactions}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && transactions.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No transactions found for this user.
          </CardContent>
        </Card>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left">Transaction ID</th>
                <th className="p-4 text-left">Service</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction, index) => (
                <tr
                  key={transaction._id || index}
                  className="border-t"
                >
                  <td className="p-4">
                    {transaction.transactionId ||
                      transaction._id ||
                      "N/A"}
                  </td>

                  <td className="p-4">
                    {transaction.serviceName ||
                      transaction.service ||
                      "N/A"}
                  </td>

                  <td className="p-4">
                    $
                    {transaction.amount ??
                      transaction.price ??
                      0}
                  </td>

                  <td className="p-4">
                    {transaction.paymentStatus ||
                      transaction.status ||
                      "N/A"}
                  </td>

                  <td className="p-4">
                    {transaction.createdAt ||
                    transaction.date
                      ? new Date(
                          transaction.createdAt ||
                            transaction.date!,
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}