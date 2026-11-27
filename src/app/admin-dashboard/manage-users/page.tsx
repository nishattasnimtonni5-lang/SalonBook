"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/app/lib/auth-client";
import { API_BASE_URL } from "@/app/lib/api/config";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const API_URL = API_BASE_URL;

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  isBlocked?: boolean;
  createdAt?: string;
};

export default function ManageUsersPage() {
  const { data: session, isPending } = authClient.useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/admin/users`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      const userList = Array.isArray(data) ? data : data.users || [];

      setUsers(
        userList.map((user: User & { _id?: string }) => ({
          ...user,
          id: user.id || user._id,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers();
    }
  }, [userRole, fetchUsers]);

  const handleBlockToggle = async (user: User) => {
    const action = user.isBlocked ? "unblock" : "block";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(user.id);

      const res = await fetch(
        `${API_URL}/admin/users/${user.id}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const value = search.toLowerCase();

    return (
      user.name?.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value)
    );
  });

  if (isPending) {
    return <p className="p-6">Loading...</p>;
  }

  if (!session?.user || userRole !== "admin") {
    return <p className="p-6">Access denied. Admin only.</p>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="mt-2 text-gray-500">
          Manage customers and their account status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Users</p>
          <h2 className="mt-2 text-2xl font-bold">{users.length}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Active Users</p>
          <h2 className="mt-2 text-2xl font-bold">
            {users.filter((user) => !user.isBlocked).length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Blocked Users</p>
          <h2 className="mt-2 text-2xl font-bold">
            {users.filter((user) => user.isBlocked).length}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold">All Users</h2>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black sm:max-w-sm"
          />
        </div>

        {loading ? (
          <p className="py-10 text-center">Loading users...</p>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-3 rounded-lg bg-black px-4 py-2 text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}

                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="p-3 text-sm">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.isBlocked
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}/transactions`}>
                            <Eye className="size-4" />
                            View
                          </Link>
                        </Button>

                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleBlockToggle(user)}
                            disabled={updatingId === user.id}
                            className={`rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 ${
                              user.isBlocked
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {updatingId === user.id
                              ? "Please wait..."
                              : user.isBlocked
                                ? "Unblock"
                                : "Block"}
                          </button>
                        )}
                      </div>
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