export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getGenerationModel } from "@/lib/ai-provider";
import {
  buildCourseContextBlock,
  getCourseSnapshotByCourseId,
  queryCourseRag,
} from "@/lib/course-rag";

export async function POST(req: NextRequest) {
  try {
    const { courseId, question } = await req.json();

    if (!courseId || !question?.trim()) {
      return NextResponse.json(
        { error: "courseId and question are required" },
        { status: 400 },
      );
    }

    const snapshot = await getCourseSnapshotByCourseId(courseId);

    if (!snapshot) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const ragResult = await queryCourseRag({
      topicName: snapshot.topicName,
      question,
      topK: 6,
    });

    const contextBlock = buildCourseContextBlock(snapshot, ragResult.matches);

    const model = getGenerationModel({
      provider: "local-ai",
      temperature: 0.2,
      model: "mistral:latest",
    });

    const prompt = `You are a helpful course tutor inside an AI video course app.
Answer using only the course context below.
If the context is not enough, say you do not have enough course information.
Keep the answer concise, practical, and friendly.
  Format your response exactly like this:
  Summary: <1-2 lines>
  Key Points:
  - <point 1>
  - <point 2>
  - <point 3 if needed>
  Next Step: <single actionable suggestion>

COURSE CONTEXT:
${contextBlock}

USER QUESTION:
${question}

ANSWER:`;

    const response = await model.generateContent(prompt);
    const answer = response.response.text();

    return NextResponse.json({
      answer,
      namespace: ragResult.namespace,
      sources: ragResult.matches.map((match) => match.metadata || {}),
      pineconeAvailable: ragResult.pineconeAvailable,
    });
  } catch (error) {
    console.error("Course chat error:", error);
    return NextResponse.json(
      { error: "Failed to answer course question" },
      { status: 500 },
    );
  }
}
