"use client";

import {
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { buildAuthUrl } from "@/lib/auth-role";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/forum", label: "Forum" },
  { href: "/generate", label: "Generate" },
  { href: "/profile", label: "Profile" },
];

const Header = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl transition-all">
      <Container
        size="xl"
        className="flex items-center justify-between gap-4 py-4"
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
            IB
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950">IBEX</p>
            <p className="text-[11px] font-medium tracking-wide text-slate-400">
              Anonymous learning
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-indigo-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild size="sm" variant="ghost">
                <Link href={buildAuthUrl("/sign-in", "user")}>User Login</Link>
              </Button>
              <Button asChild size="sm" className="shadow-md shadow-indigo-500/20">
                <Link href={buildAuthUrl("/sign-in", "mentor")}>Mentor Login</Link>
              </Button>
            </div>
          </SignedOut>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white/95 px-4 pb-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SignedOut>
            <div className="mt-4 grid gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link
                  href={buildAuthUrl("/sign-in", "user")}
                  onClick={() => setMobileOpen(false)}
                >
                  User Login
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link
                  href={buildAuthUrl("/sign-in", "mentor")}
                  onClick={() => setMobileOpen(false)}
                >
                  Mentor Login
                </Link>
              </Button>
            </div>
          </SignedOut>
        </div>
      )}
    </header>
  );
};

export default Header;
