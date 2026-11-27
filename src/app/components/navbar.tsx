"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Scissors } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "../lib/auth-client";
import { API_BASE_URL } from "@/app/lib/api/config";



import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Browse Services" },
  { href: "/offers", label: "Offers" },
  { href: "/about", label: "About Us" },
];

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const showAuthLoading = isPending || signingOut;

  const authenticated = !showAuthLoading && !!session?.user;

  const userRole = authenticated
    ? (session.user as typeof session.user & { role?: string }).role
    : undefined;

  const dashboardLink =
    userRole === "admin" ? "/admin-dashboard" : "/dashboard";

  const currentPage = pathname || "/";

  const signInHref = `/signin?callbackURL=${encodeURIComponent(currentPage)}`;
  const signUpHref = `/signup?callbackURL=${encodeURIComponent(currentPage)}`;

  const dashboardHref = authenticated
    ? dashboardLink
    : "/signin?callbackURL=%2F";

  const handleSignout = async () => {
    setSigningOut(true);

    try {
      await authClient.signOut();

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      setMenuOpen(false);
      router.replace("/");
      router.refresh();
      setSigningOut(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.145] dark:bg-black/80">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-black dark:text-zinc-50"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm shadow-rose-500/30">
            <Scissors className="size-4" />
          </span>

          <span className="text-lg font-semibold tracking-tight">
            SalonBook
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li>
            <Link
              href={dashboardHref}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
          </li>
        </ul>

        {showAuthLoading ? (
          <div className="h-9 w-20" />
        ) : authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<button />}>
              <Avatar>
                <AvatarImage
                  src={session.user.image || ""}
                  alt={session.user.name}
                />

                <AvatarFallback>
                  {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem>Profile</DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href={dashboardLink} />}
                >
                  Dashboard
                </DropdownMenuItem>

                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleSignout}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={signInHref}
              className="hidden h-9 items-center justify-center px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50 sm:flex"
            >
              Sign In
            </Link>

            <Link
              href={signUpHref}
              className="flex h-9 items-center justify-center rounded-full bg-rose-600 px-5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              Sign Up
            </Link>
          </div>
        )}

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={<button />}
            aria-label="Open menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/[.08] text-zinc-700 transition-colors hover:bg-black/[.04] md:hidden dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-white/[.08]"
          >
            <Menu className="size-5" />
          </SheetTrigger>

          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-rose-600 text-white">
                  <Scissors className="size-3.5" />
                </span>

                SalonBook
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-muted hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href={dashboardHref}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-muted hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                Dashboard
              </Link>
            </nav>

            {showAuthLoading ? null : authenticated ? (
              <div className="mt-auto flex flex-col gap-2 px-4 pb-4">
                <button
                  onClick={handleSignout}
                  className="flex h-9 items-center justify-center rounded-full border border-black/[.08] px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-auto flex flex-col gap-2 px-4 pb-4">
                <Link
                  href={signInHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 items-center justify-center rounded-full border border-black/[.08] px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-300"
                >
                  Sign In
                </Link>

                <Link
                  href={signUpHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 items-center justify-center rounded-full bg-rose-600 px-5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}