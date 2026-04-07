type ValidationOptions = {
  minLength?: number;
  maxLinks?: number;
};

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  minLength: 4,
  maxLinks: 2,
};

export const validateCommunityMessage = (
  input: string,
  options?: ValidationOptions,
) => {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const content = input.trim();

  if (content.length < settings.minLength) {
    return "Your message doesn’t meet community guidelines.";
  }

  const linkCount = (content.match(/https?:\/\//gi) ?? []).length;
  if (linkCount > settings.maxLinks) {
    return "Your message doesn’t meet community guidelines.";
  }

  if (/(.)\1{10,}/.test(content)) {
    return "Your message doesn’t meet community guidelines.";
  }

  const letters = content.replace(/[^a-z]/gi, "");
  if (letters.length >= 16) {
    const uppercaseRatio =
      letters.split("").filter((letter) => letter === letter.toUpperCase()).length /
      letters.length;

    if (uppercaseRatio > 0.9) {
      return "Your message doesn’t meet community guidelines.";
    }
  }

  return null;
};
