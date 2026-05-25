import { clerkAppearance } from "@/lib/clerk-appearance";

/** Shared options for modal sign-in/up (OAuth must redirect; popup/modal breaks first Google signup). */
export const clerkModalAuth = {
  appearance: clerkAppearance,
  oauthFlow: "redirect" as const,
  forceRedirectUrl: "/account",
  signUpForceRedirectUrl: "/account",
};

/** Modal opts with a custom post-auth redirect (Studio, deep links, etc.). */
export function clerkModalAuthWithRedirect(redirectPath: string) {
  return {
    ...clerkModalAuth,
    forceRedirectUrl: redirectPath,
    signUpForceRedirectUrl: redirectPath,
  };
}
