export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { forumThreadsQuerySchema } from "@/lib/validators/forum";
import { getThreads } from "@/services/forum.service";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const query = forumThreadsQuerySchema.parse({
      page: req.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: req.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const data = await getThreads(query);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error, "Failed to fetch threads");
  }
}
