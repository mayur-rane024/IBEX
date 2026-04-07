export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

import { indexTopicRecords } from "@/lib/course-rag";
import { unauthorized, handleRouteError } from "@/lib/route-errors";
import { createDocument } from "@/services/document.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const formData = await req.formData();
    const topicName = String(formData.get("topicName") || "").trim();
    const file = formData.get("file");

    if (!topicName) {
      return NextResponse.json(
        { error: "topicName is required" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A PDF file is required" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    let text = "";

    try {
      const parsed = await parser.getText();
      text = (parsed.text || "").trim();
    } finally {
      await parser.destroy();
    }

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF" },
        { status: 400 },
      );
    }

    const sourceId = `pdf_${Date.now()}_${file.name.replace(/\s+/g, "-")}`;
    const result = await indexTopicRecords({
      userId,
      topicName,
      sourceId,
      records: [text],
      metadata: {
        sourceType: "pdf",
        fileName: file.name,
      },
    });

    const namespace =
      "namespace" in result && typeof result.namespace === "string"
        ? result.namespace
        : null;

    await createDocument({
      id: sourceId,
      userId,
      title: file.name,
      topicName,
      namespace,
    });

    return NextResponse.json({
      success: true,
      indexed: result.indexed,
      namespace,
      documentCount: "documentCount" in result ? result.documentCount : 0,
      message: result.indexed
        ? "PDF indexed successfully"
        : "PDF was processed, but indexing is not active",
    });
  } catch (error) {
    return handleRouteError(error, "Failed to upload and index PDF");
  }
}
