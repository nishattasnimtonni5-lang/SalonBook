"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/app/lib/auth-client";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";


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
