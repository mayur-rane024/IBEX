"use client";

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

import { Container } from "@/components/ui/container";

const navItems = [
  { href: "/forum", label: "Forum" },
  { href: "/generate", label: "Generate" },
  { href: "/profile", label: "Profile" },
];

const navItemClass =
  "text-sm font-medium text-slate-500 transition-colors hover:text-slate-950";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/92 backdrop-blur-md">
      <Container
        size="xl"
        className="flex flex-wrap items-center justify-between gap-4 py-4"
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-cyan-400 text-sm font-semibold text-white">
            IB
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950">IBEX</p>
            <p className="text-xs text-slate-500">Anonymous learning</p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto pb-1 md:order-none md:w-auto md:justify-center md:pb-0">
          <Link href="/" className={navItemClass}>
            Home
          </Link>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navItemClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-[#4338ca]"
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </Container>
    </header>
  );
};

export default Header;
