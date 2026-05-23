import { clerkAppearance } from "@/lib/clerk-appearance";

/** Shared options for modal sign-in/up (OAuth must redirect; popup/modal breaks first Google signup). */
export const clerkModalAuth = {
  appearance: clerkAppearance,
  oauthFlow: "redirect" as const,
  forceRedirectUrl: "/account",
  signInForceRedirectUrl: "/account",
  signUpForceRedirectUrl: "/account",
};
