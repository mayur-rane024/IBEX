export const APP_ROLES = ["user", "mentor"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const DEFAULT_APP_ROLE: AppRole = "user";

export const APP_ROLE_CONTENT: Record<
  AppRole,
  {
    badge: string;
    description: string;
    label: string;
    loginTitle: string;
    signUpTitle: string;
  }
> = {
  user: {
    badge: "Learner access",
    description:
      "For learners creating AI courses, asking questions, and joining anonymous discussions.",
    label: "User",
    loginTitle: "User login",
    signUpTitle: "Create a user account",
  },
  mentor: {
    badge: "Mentor access",
    description:
      "For mentors entering through a dedicated access path while mentor-specific areas are being rolled out.",
    label: "Mentor",
    loginTitle: "Mentor login",
    signUpTitle: "Create a mentor account",
  },
};

export const isAppRole = (value: unknown): value is AppRole =>
  typeof value === "string" && APP_ROLES.includes(value as AppRole);

export const resolveAppRole = (value: unknown): AppRole =>
  isAppRole(value) ? value : DEFAULT_APP_ROLE;

export const buildAuthUrl = (
  pathname: "/sign-in" | "/sign-up",
  role: AppRole,
) => `${pathname}?role=${role}`;
