export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { unauthorized, handleRouteError } from "@/lib/route-errors";
import { getOwnedSlideAudio } from "@/services/course.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slideId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const { slideId } = await params;
    const audioRecord = await getOwnedSlideAudio(userId, slideId);

    if (!audioRecord?.audioFileUrl) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const audioFileUrl = audioRecord.audioFileUrl;

    if (audioFileUrl.startsWith("/audio/")) {
      const filePath = path.join(
        process.cwd(),
        "public",
        audioFileUrl.replace(/^\//, ""),
      );
      const audioBuffer = await fs.readFile(filePath);

      return new Response(new Uint8Array(audioBuffer), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const audioResponse = await fetch(audioFileUrl);
    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch audio from remote storage" },
        { status: 500 },
      );
    }

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    return new Response(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return handleRouteError(error, "Failed to retrieve audio");
  }
}
