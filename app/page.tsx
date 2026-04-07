import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Home() {
  return (
    <main className="py-20 sm:py-28">
      <Container size="lg">
        <section className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-600">
              IBEX | Calm, anonymous learning
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                Ask freely.
                <br />
                Learn deeply.
                <br />
                Stay anonymous.
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-500">
                IBEX gives students a quiet space to generate learning material,
                join pseudonymous discussions, and explore ideas without social
                pressure.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-40">
                <Link href="/forum">Enter Forum</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="min-w-40">
                <Link href="/generate">Generate Course</Link>
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
