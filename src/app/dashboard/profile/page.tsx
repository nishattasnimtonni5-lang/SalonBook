"use client";

import { authClient } from "@/app/lib/auth-client";
import { useEffect, useState } from "react";


export default function CustomerProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || "");
    }
  }, [session]);

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { error } = await authClient.updateUser({
        name,
        image: image || undefined,
      });

      if (error) {
        setMessage(error.message || "Profile update failed");
      } else {
        setMessage("Profile updated successfully!");
        setEditing(false);
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) return <p>Loading...</p>;

  if (!session?.user || session.user.role === "admin") {
    return <p>Access denied. Customer only.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-gray-200">
            {image && (
              <img
                src={image}
                alt="Customer"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-gray-500">Customer Account</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-medium">Full Name</label>
            <input
              value={name}
              disabled={!editing}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border p-3 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Email</label>
            <input
              value={session.user.email}
              disabled
              className="w-full rounded-lg border bg-gray-100 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Profile Image URL
            </label>
            <input
              value={image}
              disabled={!editing}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Enter image URL"
              className="w-full rounded-lg border p-3 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Role</label>
            <input
              value="Customer"
              disabled
              className="w-full rounded-lg border bg-gray-100 p-3"
            />
          </div>

          {message && <p className="text-sm">{message}</p>}

          {editing ? (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 rounded-lg bg-black p-3 text-white"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>

              <button
                onClick={() => {
                  setName(session.user.name || "");
                  setImage(session.user.image || "");
                  setEditing(false);
                }}
                className="rounded-lg border px-5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full rounded-lg bg-black p-3 text-white"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}