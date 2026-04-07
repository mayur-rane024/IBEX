export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { unauthorized, handleRouteError } from "@/lib/route-errors";
import { getCourseForUser } from "@/services/course.service";

const querySchema = z.object({
  courseId: z.string().trim().min(1).max(255),
});

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const { courseId } = querySchema.parse({
      courseId: req.nextUrl.searchParams.get("courseId"),
    });

    const course = await getCourseForUser(userId, courseId);
    return NextResponse.json(course);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch course data");
  }
}
