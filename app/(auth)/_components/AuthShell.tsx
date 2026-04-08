import type { ReactNode } from "react";

import { ArrowRight, BookOpen, type LucideIcon, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  APP_ROLE_CONTENT,
  APP_ROLES,
  type AppRole,
  buildAuthUrl,
} from "@/lib/auth-role";

const roleIcons: Record<AppRole, LucideIcon> = {
  user: BookOpen,
  mentor: Users,
};

type AuthShellProps = {
  children: ReactNode;
  description: string;
  mode: "sign-in" | "sign-up";
  role: AppRole;
  title: string;
};

export default function AuthShell({
  children,
  description,
  mode,
  role,
  title,
}: AuthShellProps) {
  const roleCopy = APP_ROLE_CONTENT[role];
  const Icon = roleIcons[role];
  const currentPath = mode === "sign-in" ? "/sign-in" : "/sign-up";
  const alternatePath = mode === "sign-in" ? "/sign-up" : "/sign-in";
  const alternateLabel =
    mode === "sign-in" ? "Need an account?" : "Already have an account?";
  const alternateAction =
    mode === "sign-in"
      ? roleCopy.signUpTitle
      : `${roleCopy.label.toLowerCase()} login`;

  return (
    <main className="relative overflow-hidden py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-indigo-300/20 blur-[120px]" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-cyan-300/20 blur-[140px]" />
      </div>

      <Container size="xl" className="relative">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8 rounded-[2rem] border border-slate-200/70 bg-white/75 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-sm sm:p-10">
            <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
              {APP_ROLES.map((item) => {
                const isActive = item === role;
                const href = buildAuthUrl(currentPath, item);

                return (
                  <Link
                    key={item}
                    href={href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {APP_ROLE_CONTENT[item].label}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600">
                <Icon className="size-4" />
                {roleCopy.badge}
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Dedicated access path
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose the right login now and IBEX keeps that role attached to
                  your account.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Same secure platform
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Clerk still handles authentication, while the app stores the
                  selected role for future role-based pages.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-2xl shadow-slate-200/50 sm:p-8">
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4 sm:p-6">
              {children}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">{alternateLabel}</p>
              <Button asChild variant="outline" className="gap-2">
                <Link href={buildAuthUrl(alternatePath, role)}>
                  {alternateAction}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
