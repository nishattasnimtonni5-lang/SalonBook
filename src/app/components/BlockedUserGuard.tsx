"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api/config";

export default function BlockedUserGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "allowed" | "blocked" | "error"
  >("loading");

  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me/status`, {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/signin");
          return;
        }

        if (!response.ok) {
          if (active) setStatus("error");
          return;
        }

        const data = await response.json();

        if (active) {
          setStatus(data.isBlocked ? "blocked" : "allowed");
        }
      } catch {
        if (active) setStatus("error");
      }
    };

    checkStatus();

    return () => {
      active = false;
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Checking your account...
        </p>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg dark:bg-zinc-950">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950">
            <LockKeyhole className="size-8" />
          </div>

          <h1 className="mb-3 text-2xl font-bold">
            Account Temporarily Restricted
          </h1>

          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            Your account has been blocked by the administrator. You cannot
            access this feature right now. Please contact support if you
            believe this is a mistake.
          </p>

          <button
            onClick={() => router.push("/")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 px-6 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Unable to verify your account status.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full border px-5 py-2 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}