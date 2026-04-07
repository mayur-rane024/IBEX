export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { unauthorized, handleRouteError } from "@/lib/route-errors";
import { generateVideoContentRequestSchema } from "@/lib/validators/course";
import { generateCourseSlidesForUser } from "@/services/course-generation.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const body = generateVideoContentRequestSchema.parse(await req.json());
    const result = await generateCourseSlidesForUser({
      userId,
      courseId: body.courseId,
      chapterId: body.chapterId,
      chapter: body.chapter,
    });

    return NextResponse.json({
      slides: result.slides,
      audioUrls: result.audioUrls,
      message: "Video content generated successfully",
    });
  } catch (error) {
    return handleRouteError(error, "Failed to generate video content");
  }
}
