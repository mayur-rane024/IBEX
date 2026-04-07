export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";

import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { forumThreadParamsSchema } from "@/lib/validators/forum";
import { getThreadById } from "@/services/forum.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const parsedParams = forumThreadParamsSchema.parse(await params);
    const thread = await getThreadById(parsedParams.id);

    return successResponse(thread);
  } catch (error) {
    return handleApiError(error, "Failed to fetch thread");
  }
}
