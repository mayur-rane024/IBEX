import { z } from "zod";

const trimFencedBlock = (value: string) => {
  const fenced = value.trim().match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1]?.trim() ?? value.trim();
};

export const extractJsonPayload = (value: string) => {
  const trimmed = trimFencedBlock(value);
  const firstObject = trimmed.indexOf("{");
  const firstArray = trimmed.indexOf("[");

  const firstIndex =
    firstObject === -1
      ? firstArray
      : firstArray === -1
        ? firstObject
        : Math.min(firstObject, firstArray);

  if (firstIndex === -1) {
    return trimmed;
  }

  const lastObject = trimmed.lastIndexOf("}");
  const lastArray = trimmed.lastIndexOf("]");
  const lastIndex = Math.max(lastObject, lastArray);

  if (lastIndex <= firstIndex) {
    return trimmed.slice(firstIndex);
  }

  return trimmed.slice(firstIndex, lastIndex + 1);
};

export const parseJsonWithSchema = <T>(
  rawValue: string,
  schema: z.ZodType<T>,
): T => {
  const extracted = extractJsonPayload(rawValue);
  const parsed = JSON.parse(extracted) as unknown;
  return schema.parse(parsed);
};
