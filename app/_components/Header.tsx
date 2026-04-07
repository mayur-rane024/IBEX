"use client";

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const Header = () => {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex gap-2 items-center">
        <Image src="/logo.png" alt="logo" width={45} height={45} />
        <h2 className="text-xl font-bold">
          <span className="text-primary">Vid</span>Course
        </h2>
      </div>

      <ul className="flex gap-8 text-center">
        <li className="text-lg hover:text-primary cursor-pointer font-medium">
          <Link href="/">Home</Link>
        </li>
        <li className="text-lg hover:text-primary cursor-pointer font-medium">
          Pricing
        </li>
      </ul>

      <SignedIn>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {user?.firstName || user?.username || "Learner"}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <Button>Get Started</Button>
        </SignInButton>
      </SignedOut>
    </div>
  );
};

export default Header;
