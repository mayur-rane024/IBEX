export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { unauthorized, handleRouteError } from "@/lib/route-errors";
import { createCourseRequestSchema } from "@/lib/validators/course";
import { generateCourseLayoutForUser } from "@/services/course-generation.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const body = createCourseRequestSchema.parse(await req.json());
    const course = await generateCourseLayoutForUser({
      userId,
      userInput: body.userInput,
      courseId: body.courseId,
      type: body.type,
      aiProvider: body.aiProvider,
      slideModel: body.slideModel,
    });

    return NextResponse.json(course);
  } catch (error) {
    return handleRouteError(error, "Failed to generate course layout");
  }
}
