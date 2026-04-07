export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getGenerationModel } from "@/lib/ai-provider";
import {
  buildTopicContextFromMatches,
  queryTopicRecords,
} from "@/lib/course-rag";
import { unauthorized, handleRouteError } from "@/lib/route-errors";
import {
  conversationQuerySchema,
  homeChatRequestSchema,
} from "@/lib/validators/chat";
import {
  addMessage,
  createConversation,
  getMessages,
} from "@/services/chat.service";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const body = homeChatRequestSchema.parse(await req.json());

    const conversation =
      body.conversationId
        ? { id: body.conversationId }
        : await createConversation(userId, null);

    await addMessage({
      userId,
      conversationId: conversation.id,
      role: "user",
      content: body.question,
    });

    const ragResult = await queryTopicRecords({
      userId,
      topicName: body.topicName,
      question: body.question,
      topK: 8,
    });

    if (!ragResult.matches.length) {
      const answer =
        "I could not find records for this topic yet. Please upload a PDF so I can learn this topic first.";

      await addMessage({
        userId,
        conversationId: conversation.id,
        role: "assistant",
        content: answer,
      });

      return NextResponse.json({
        answer,
        conversationId: conversation.id,
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
${body.topicName}

CONTEXT:
${context}

QUESTION:
${body.question}

ANSWER:`;

    const response = await model.generateContent(prompt);
    const answer = response.response.text();

    await addMessage({
      userId,
      conversationId: conversation.id,
      role: "assistant",
      content: answer,
      sources: ragResult.matches.map((match) => match.metadata || {}),
      metadata: {
        namespace: ragResult.namespace,
        pineconeAvailable: ragResult.pineconeAvailable,
      },
    });

    return NextResponse.json({
      answer,
      conversationId: conversation.id,
      needUpload: false,
      namespace: ragResult.namespace,
      sources: ragResult.matches.map((match) => match.metadata || {}),
      pineconeAvailable: ragResult.pineconeAvailable,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to process home chat query");
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const conversationId = conversationQuerySchema.parse({
      conversationId: req.nextUrl.searchParams.get("conversationId"),
    }).conversationId;

    const messages = await getMessages(userId, conversationId);

    return NextResponse.json({
      conversationId,
      messages,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to retrieve conversation");
  }
}
