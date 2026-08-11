import Link from "next/link";

import { AuthControls } from "@/components/layout/AuthControls";

const links = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#stats" },
];

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
      <nav className="glass-nav flex w-full max-w-3xl items-center justify-between rounded-full px-2 py-1.5 pl-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]">
            PC
          </span>
          <span className="hidden text-sm sm:inline">PDF Chat</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <AuthControls />
        </div>
      </nav>
    </header>
  );
}
