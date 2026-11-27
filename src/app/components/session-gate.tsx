"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/app/lib/auth-client";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

/**
 * Client-side session guard.
 *
 * The BetterAuth session cookie lives on the backend domain, so Next's
 * server-side `auth.api.getSession()` (reading this request's cookies) can
 * never see it. The same `useSession()` the navbar uses is the source of
 * truth: while the session check is pending — or once it comes back empty —
 * render a spinner and send signed-out visitors to /signin with a callback.
 *
 * Once the session resolves, the token is mirrored into a same-origin
 * cookie BEFORE children render, so the dashboard's /api calls (reports,
 * appointments, offers…) can authenticate their requests.
 */
export default function SessionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [cookieReady, setCookieReady] = useState(false);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace(
        `/signin?callbackURL=${encodeURIComponent(pathname ?? "/")}`,
      );
      return;
    }

    const token = session.session?.token;
    // Run in a microtask so the state update stays out of the synchronous
    // effect body; children only mount after this flips, which guarantees
    // their /api calls already see the cookie.
    queueMicrotask(() => {
      if (token) {
        document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; samesite=lax`;
      }
      setCookieReady(true);
    });
  }, [isPending, session, router, pathname]);

  if (isPending || !session || !cookieReady) {
    return (
      <div
        aria-busy="true"
        aria-label="Checking your session"
        className="flex min-h-[50vh] items-center justify-center"
      >
        <Loader2 className="size-6 animate-spin text-rose-500" />
      </div>
    );
  }

  return <>{children}</>;
}
