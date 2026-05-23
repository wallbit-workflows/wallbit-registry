"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { clerkModalAuth } from "@/lib/clerk-modal-auth";

type Mode = "sign-in" | "sign-up";

type Props = {
  mode: Mode;
};

/** Opens Clerk modal when middleware redirects here (no full-page form). */
export function AuthModalLauncher({ mode }: Props) {
  const { loaded, openSignIn, openSignUp } = useClerk();
  const searchParams = useSearchParams();
  const redirectUrl =
    searchParams.get("redirect_url") ??
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ??
    clerkModalAuth.forceRedirectUrl;

  useEffect(() => {
    if (!loaded) return;

    const opts = {
      ...clerkModalAuth,
      forceRedirectUrl: redirectUrl,
      signInForceRedirectUrl: redirectUrl,
      signUpForceRedirectUrl: redirectUrl,
    };

    if (mode === "sign-in") {
      openSignIn(opts);
      return;
    }
    openSignUp(opts);
  }, [loaded, mode, openSignIn, openSignUp, redirectUrl]);

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-cloud-canvas" aria-hidden />
  );
}
