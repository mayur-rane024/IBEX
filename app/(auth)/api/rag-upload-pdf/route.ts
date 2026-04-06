export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

import { indexTopicRecords } from "@/lib/course-rag";

export async function POST(req: NextRequest) {
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
    const parsed = await pdfParse(buffer);
    const text = (parsed.text || "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF" },
        { status: 400 },
      );
    }

    const sourceId = `pdf:${Date.now()}:${file.name.replace(/\s+/g, "-")}`;

    const result = await indexTopicRecords({
      topicName,
      sourceId,
      records: [text],
      metadata: {
        sourceType: "pdf",
        fileName: file.name,
      },
    });

    return NextResponse.json({
      success: true,
      indexed: result.indexed,
      namespace: "namespace" in result ? result.namespace : null,
      documentCount: "documentCount" in result ? result.documentCount : 0,
      message: result.indexed
        ? "PDF indexed successfully"
        : "PDF was processed, but indexing is not active",
    });
  } catch (error) {
    console.error("PDF upload indexing error:", error);
    return NextResponse.json(
      { error: "Failed to upload and index PDF" },
      { status: 500 },
    );
  }
}
