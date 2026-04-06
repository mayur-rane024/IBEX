export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getGenerationModel } from "@/lib/ai-provider";
import {
  buildTopicContextFromMatches,
  queryTopicRecords,
} from "@/lib/course-rag";

export async function POST(req: NextRequest) {
  try {
    const { topicName, question } = await req.json();

    if (!topicName?.trim() || !question?.trim()) {
      return NextResponse.json(
        { error: "topicName and question are required" },
        { status: 400 },
      );
    }

    const ragResult = await queryTopicRecords({
      topicName: topicName.trim(),
      question: question.trim(),
      topK: 8,
    });

    if (!ragResult.matches.length) {
      return NextResponse.json({
        answer:
          "I could not find records for this topic yet. Please upload a PDF so I can learn this topic first.",
        needUpload: true,
        namespace: ragResult.namespace,
        pineconeAvailable: ragResult.pineconeAvailable,
      });
    }

    const context = buildTopicContextFromMatches(ragResult.matches);

    const model = getGenerationModel({
      provider: "local-ai",
      temperature: 0.2,
      model: "mistral:latest",
    });

    const prompt = `You are a helpful tutor. Answer only using the context.
If context is insufficient, explicitly say so.
Keep answers concise and practical.
  Format your response exactly like this:
  Summary: <1-2 lines>
  Key Points:
  - <point 1>
  - <point 2>
  - <point 3 if needed>
  Next Step: <single actionable suggestion>

TOPIC:
${topicName}

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:`;

    const response = await model.generateContent(prompt);

    return NextResponse.json({
      answer: response.response.text(),
      needUpload: false,
      namespace: ragResult.namespace,
      sources: ragResult.matches.map((match) => match.metadata || {}),
      pineconeAvailable: ragResult.pineconeAvailable,
    });
  } catch (error) {
    console.error("Home chat error:", error);
    return NextResponse.json(
      { error: "Failed to process home chat query" },
      { status: 500 },
    );
  }
}
