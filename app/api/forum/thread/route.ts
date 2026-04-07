export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { createForumThreadSchema } from "@/lib/validators/forum";
import { createThread } from "@/services/forum.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const body = createForumThreadSchema.parse(await req.json());
    const thread = await createThread(userId, body.title, body.content);

    return successResponse(thread, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create thread");
  }
}
