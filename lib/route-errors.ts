import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logServerError } from "@/lib/safe-error-log";
import { ServiceError } from "@/lib/service-error";

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const handleRouteError = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: error.status },
    );
  }

  logServerError(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
};
