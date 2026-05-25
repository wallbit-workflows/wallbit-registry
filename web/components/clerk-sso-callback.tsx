import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

type Props = {
  /** Where to send users after OAuth when sign-in/sign-up completes without extra fields. */
  fallbackRedirectUrl?: string;
};

/**
 * Handles OAuth return for sign-in modal flows. New users are transferred to sign-up
 * inside Clerk; missing fields (e.g. username) continue at /sign-in/continue.
 */
export function ClerkSsoCallback({
  fallbackRedirectUrl = "/account",
}: Props) {
  return (
    <>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl="/sign-in/continue"
        signInFallbackRedirectUrl={fallbackRedirectUrl}
        signUpFallbackRedirectUrl={fallbackRedirectUrl}
      />
      {/* Required when Clerk bot protection / sign-up transfer runs after OAuth */}
      <div id="clerk-captcha" />
    </>
  );
}
