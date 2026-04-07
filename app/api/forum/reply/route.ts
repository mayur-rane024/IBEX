export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { createForumReplySchema } from "@/lib/validators/forum";
import { createReply } from "@/services/forum.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const body = createForumReplySchema.parse(await req.json());
    const reply = await createReply(
      userId,
      body.threadId,
      body.content,
      body.parentReplyId,
    );

    return successResponse(reply, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create reply");
  }
}
