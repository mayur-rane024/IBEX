const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Unknown error",
  };
};

export const logServerError = (context: string, error: unknown) => {
  const normalized = normalizeError(error);
  console.error(context, normalized);
};
