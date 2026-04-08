import { SignUp } from "@clerk/nextjs";

import AuthShell from "@/app/(auth)/_components/AuthShell";
import { APP_ROLE_CONTENT, buildAuthUrl, resolveAppRole } from "@/lib/auth-role";

type SignUpPageProps = {
  searchParams: Promise<{
    role?: string | string[];
  }>;
};

const getSingleValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const role = resolveAppRole(getSingleValue(params.role));
  const roleCopy = APP_ROLE_CONTENT[role];

  return (
    <AuthShell
      role={role}
      mode="sign-up"
      title={roleCopy.signUpTitle}
      description={roleCopy.description}
    >
      <SignUp
        fallbackRedirectUrl="/"
        signInUrl={buildAuthUrl("/sign-in", role)}
        unsafeMetadata={{ role }}
      />
    </AuthShell>
  );
}
