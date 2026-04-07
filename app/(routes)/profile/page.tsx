import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { resolveForumAvatar } from "@/lib/forum";
import { getProfile, regenerateProfile } from "@/services/profile.service";

const initialsFromPseudonym = (pseudonym: string) =>
  pseudonym
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

async function regenerateIdentityAction() {
  "use server";

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  await regenerateProfile(userId);
  revalidatePath("/profile");
}

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await getProfile(userId);

  return (
    <main className="py-16 sm:py-20">
      <Container size="md">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
              Profile
            </p>
            <h1 className="text-4xl font-bold text-slate-950">Your anonymous identity</h1>
            <p className="text-base leading-7 text-slate-500">
              This identity is what other learners see in forum discussions.
            </p>
          </div>

          <Card className="bg-white">
            <CardHeader className="items-center gap-5 px-6 pt-8 text-center">
              <Avatar className="size-20">
                <AvatarImage
                  src={resolveForumAvatar(profile.avatar)}
                  alt={`${profile.pseudonym} avatar`}
                />
                <AvatarFallback className="text-lg">
                  {initialsFromPseudonym(profile.pseudonym) || "IB"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  Pseudonym
                </p>
                <CardTitle className="text-3xl text-slate-950">
                  {profile.pseudonym}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-8 text-center">
              <p className="text-sm leading-6 text-slate-500">
                Regenerating updates your identity for future interactions. Your
                existing forum posts and replies keep their original snapshots.
              </p>
              <form action={regenerateIdentityAction}>
                <Button type="submit" size="lg">
                  Regenerate identity
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
