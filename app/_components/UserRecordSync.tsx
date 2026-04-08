import { auth } from "@clerk/nextjs/server";

import { syncUserRecord } from "@/services/profile.service";

export default async function UserRecordSync() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    await syncUserRecord(userId);
  } catch (error) {
    console.error("Failed to sync the signed-in user record.", error);
  }

  return null;
}
