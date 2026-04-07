import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logServerError } from "@/lib/safe-error-log";
import { ServiceError } from "@/lib/service-error";

export const successResponse = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const errorResponse = (message: string, status = 500) =>
  NextResponse.json({ success: false, message }, { status });

export const handleApiError = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof ZodError) {
    return errorResponse("Invalid request", 400);
  }

  if (error instanceof ServiceError) {
    return errorResponse(error.message, error.status);
  }

  logServerError(fallbackMessage, error);
  return errorResponse(fallbackMessage, 500);
};
