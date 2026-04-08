import { SignIn } from "@clerk/nextjs";

import AuthShell from "@/app/(auth)/_components/AuthShell";
import { APP_ROLE_CONTENT, buildAuthUrl, resolveAppRole } from "@/lib/auth-role";

type SignInPageProps = {
  searchParams: Promise<{
    role?: string | string[];
  }>;
};

const getSingleValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const role = resolveAppRole(getSingleValue(params.role));
  const roleCopy = APP_ROLE_CONTENT[role];

  return (
    <AuthShell
      role={role}
      mode="sign-in"
      title={roleCopy.loginTitle}
      description={roleCopy.description}
    >
      <SignIn
        fallbackRedirectUrl="/"
        signUpUrl={buildAuthUrl("/sign-up", role)}
        unsafeMetadata={{ role }}
        withSignUp
      />
    </AuthShell>
  );
}
