import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import ForumListPage from "@/components/forum/ForumListPage";
import { getForumComposerAccess } from "@/services/forum.service";

export default async function ForumPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const composerAccess = await getForumComposerAccess(userId);

  return (
    <ForumListPage
      canCreateThread={composerAccess.canCreateThread}
      gateMessage={composerAccess.message}
    />
  );
}
