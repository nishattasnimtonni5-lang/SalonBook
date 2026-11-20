import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Scissors } from "lucide-react";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Browse Services" },
  { href: "/signin", label: "Sign In" },
  { href: "/signup", label: "Sign Up" },
];

const openingHours = [
  { days: "Monday – Friday", hours: "9:00 AM – 8:00 PM" },
  { days: "Saturday", hours: "9:00 AM – 6:00 PM" },
  { days: "Sunday", hours: "10:00 AM – 5:00 PM" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-full"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-full">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.92 3.77-3.92 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.9h2.78l-.45 2.9h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://www.x.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-full">
        <path d="M17.53 3h2.97l-6.49 7.41L21.75 21h-5.97l-4.68-6.12L5.72 21H2.75l6.94-7.93L2.25 3h6.12l4.23 5.6L17.53 3zm-1.04 16.2h1.65L7.59 4.7H5.81l10.68 14.5z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-full">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M21.58 7.19a2.52 2.52 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41A2.52 2.52 0 0 0 2.42 7.19 26.1 26.1 0 0 0 2 12a26.1 26.1 0 0 0 .42 4.81 2.52 2.52 0 0 0 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.52 2.52 0 0 0 1.77-1.78A26.1 26.1 0 0 0 22 12a26.1 26.1 0 0 0-.42-4.81zM10 15.5v-7l6 3.5-6 3.5z"
        />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950 text-zinc-400">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-rose-600 text-white">
                <Scissors className="size-4" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                SalonBook
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6">
              SalonBook makes it easy to discover top-rated salons, browse
              services and request appointments online — all in one place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <span className="size-4">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
              Quick Links
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
              Contact Us
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <li>
                <a
                  href="tel:+15551234567"
                  className="flex items-start gap-2.5 transition-colors hover:text-white"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-rose-400" />
                  +1 (555) 123-4567
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@salonbook.com"
                  className="flex items-start gap-2.5 transition-colors hover:text-white"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-rose-400" />
                  hello@salonbook.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-rose-400" />
                <span>
                  123 Beauty Lane, Suite 100
                  <br />
                  Los Angeles, CA 90001
                </span>
              </li>
            </ul>
          </div>

          {/* Opening hours */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
              Opening Hours
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              {openingHours.map((slot) => (
                <li key={slot.days} className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0 text-rose-400" />
                  <span>
                    <span className="block text-zinc-300">{slot.days}</span>
                    {slot.hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-sm sm:flex-row">
          <p>© 2026 SalonBook. All rights reserved.</p>
          <p className="text-zinc-500">Look good. Feel great. Book easily.</p>
        </div>
      </div>
    </footer>
  );
}
