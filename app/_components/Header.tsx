"use client";

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { MessageSquareText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const Header = () => {
  const { user } = useUser();

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.3)] backdrop-blur sm:px-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={45} height={45} />
            <h2 className="text-xl font-bold">
              <span className="text-primary">Vid</span>Course
            </h2>
          </Link>
        </div>

        <ul className="hidden items-center gap-6 text-center md:flex">
          <li className="text-sm font-medium text-slate-600 transition-colors hover:text-primary">
            <Link href="/">Home</Link>
          </li>
          <li className="text-sm font-medium text-slate-600 transition-colors hover:text-primary">
            <Link href="/forum">Forum</Link>
          </li>
          <li className="text-sm font-medium text-slate-500">Pricing</li>
        </ul>

        <SignedIn>
          <div className="flex items-center gap-3">
            <Link
              href="/forum"
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 sm:flex"
            >
              <MessageSquareText className="size-4" />
              Forum
            </Link>
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">
              {user?.firstName || user?.username || "Learner"}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <Button className="rounded-full">Get Started</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
};

export default Header;
