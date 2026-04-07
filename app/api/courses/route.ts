export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { unauthorized, handleRouteError } from "@/lib/route-errors";
import { listCoursesForUser } from "@/services/course.service";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const courses = await listCoursesForUser(userId);
    return NextResponse.json({ courses });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch courses");
  }
}
