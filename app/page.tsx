import Link from "next/link";
import {
  BookOpen,
  Brain,
  MessageSquare,
  Shield,
  Sparkles,
  Video,
  Zap,
  ArrowRight,
  Users,
  FileText,
  Bot,
} from "lucide-react";

import HomeChatPanel from "@/app/_components/HomeChatPanel";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { APP_ROLE_CONTENT, buildAuthUrl } from "@/lib/auth-role";

const features = [
  {
    icon: Video,
    title: "AI Video Courses",
    description:
      "Transform any topic into a structured video course with AI-generated content, slides, and narration.",
    gradient: "from-indigo-500 to-violet-500",
    bgGlow: "bg-indigo-500/10",
  },
  {
    icon: MessageSquare,
    title: "Anonymous Forum",
    description:
      "Discuss ideas freely in pseudonymous threads — no social pressure, just genuine knowledge sharing.",
    gradient: "from-cyan-500 to-teal-500",
    bgGlow: "bg-cyan-500/10",
  },
  {
    icon: Brain,
    title: "RAG-Powered Chat",
    description:
      "Upload PDFs and build personal knowledge bases. Ask questions grounded in your own material.",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/10",
  },
];

const stats = [
  { value: "100%", label: "Anonymous", icon: Shield },
  { value: "AI", label: "Powered", icon: Bot },
  { value: "RAG", label: "Retrieval", icon: FileText },
  { value: "Open", label: "Community", icon: Users },
];

const steps = [
  {
    step: "01",
    title: "Choose a Topic",
    description: "Enter any subject you want to learn — from React to quantum physics.",
  },
  {
    step: "02",
    title: "AI Generates Content",
    description: "Our AI builds a complete course layout with chapters, scripts, and visuals.",
  },
  {
    step: "03",
    title: "Learn & Discuss",
    description: "Watch your course, ask questions in topic chat, or join the anonymous forum.",
  },
];

const accessOptions = [
  {
    role: "user" as const,
    icon: BookOpen,
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    role: "mentor" as const,
    icon: Users,
    gradient: "from-cyan-500 to-teal-500",
  },
];

export default function Home() {
  return (
    <main>
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pb-20 pt-20 sm:pt-28">
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-400/20 blur-[100px]" />
          <div className="absolute -right-32 top-20 h-[400px] w-[400px] animate-pulse rounded-full bg-cyan-400/15 blur-[100px] [animation-delay:1s]" />
          <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 animate-pulse rounded-full bg-violet-400/10 blur-[100px] [animation-delay:2s]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <Container size="lg" className="relative">
          <div className="flex min-h-[65vh] flex-col items-center justify-center text-center">
            <div className="max-w-3xl space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/80 px-5 py-2.5 text-sm font-medium text-indigo-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="size-4 text-indigo-500" />
                IBEX — Calm, anonymous learning
              </div>

              {/* Headline */}
              <div className="space-y-5">
                <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                  Ask freely.
                  <br />
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                    Learn deeply.
                  </span>
                  <br />
                  Stay anonymous.
                </h1>
                <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-500 sm:text-xl">
                  IBEX gives students a quiet space to generate AI-powered learning
                  material, join pseudonymous discussions, and explore ideas without
                  social pressure.
                </p>
              </div>

              <div className="mx-auto grid w-full max-w-3xl gap-4 text-left sm:grid-cols-2">
                {accessOptions.map((option) => {
                  const content = APP_ROLE_CONTENT[option.role];

                  return (
                    <div
                      key={option.role}
                      className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-sm"
                    >
                      <div
                        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${option.gradient}`}
                      />

                      <div className="relative space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                              {content.badge}
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                              {content.loginTitle}
                            </h2>
                          </div>
                          <div
                            className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${option.gradient} text-white shadow-lg`}
                          >
                            <option.icon className="size-5" />
                          </div>
                        </div>

                        <p className="text-sm leading-6 text-slate-500">
                          {content.description}
                        </p>

                        <Button
                          asChild
                          className="w-full gap-2 shadow-lg shadow-slate-200/60"
                        >
                          <Link href={buildAuthUrl("/sign-in", option.role)}>
                            {content.loginTitle}
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="group min-w-44 gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30">
                  <Link href="/forum">
                    Enter Forum
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-w-44 gap-2 border-slate-200 bg-white/70 backdrop-blur-sm">
                  <Link href="/generate">
                    <Zap className="size-4 text-indigo-500" />
                    Generate Course
                  </Link>
                </Button>
              </div>

              {/* Helper text */}
              <p className="text-sm leading-6 text-slate-400">
                Topic Chat is available from the bottom-right button — search saved
                topic memory or index a PDF for RAG retrieval.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative border-y border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <Container size="xl" className="py-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-0.5"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-indigo-500 transition-colors group-hover:from-indigo-100 group-hover:to-cyan-100">
                  <stat.icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Features Section ─── */}
      <section className="py-24">
        <Container size="lg">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-500">
              Platform Features
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                learn smarter
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Three powerful tools in one calm, anonymous platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-xl hover:shadow-slate-200/50"
              >
                {/* Hover glow */}
                <div
                  className={`absolute -right-10 -top-10 size-40 rounded-full ${feature.bgGlow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                />

                <div className="relative space-y-4">
                  <div
                    className={`inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                  >
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-slate-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── How It Works Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white py-24">
        {/* Subtle pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #6366f1 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <Container size="lg" className="relative">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-500">
              How It Works
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Start learning in{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                three simple steps
              </span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, idx) => (
              <div key={item.step} className="group relative text-center">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-gradient-to-r from-indigo-200 to-cyan-200 md:block" />
                )}

                <div className="relative mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border-2 border-indigo-100 bg-white text-2xl font-bold text-indigo-600 shadow-lg shadow-indigo-100/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-indigo-200 group-hover:shadow-xl group-hover:shadow-indigo-200/50">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Final CTA Section ─── */}
      <section className="py-24">
        <Container size="md">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-12 text-center shadow-2xl shadow-indigo-500/20 sm:p-16">
            {/* Floating orbs inside */}
            <div className="pointer-events-none absolute -right-10 -top-10 size-60 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
                <BookOpen className="size-4" />
                Ready to start?
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Your anonymous learning space awaits
              </h2>
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-indigo-100">
                Generate courses, chat with AI tutors, and discuss ideas freely — all
                without revealing your identity.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="min-w-44 gap-2 border-white/20 bg-white text-indigo-700 shadow-lg hover:bg-indigo-50"
                >
                  <Link href="/generate">
                    <Sparkles className="size-4" />
                    Generate a Course
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="min-w-44 gap-2 border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Link href="/forum">
                    Explore Forum
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <Container size="lg" className="py-10">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-bold text-white">
                IB
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">IBEX</p>
                <p className="text-xs text-slate-400">Anonymous AI Learning</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Built for learners who value privacy and genuine curiosity.
            </p>
          </div>
        </Container>
      </footer>

      <HomeChatPanel />
    </main>
  );
}
