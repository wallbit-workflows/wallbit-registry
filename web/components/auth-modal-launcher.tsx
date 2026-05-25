"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { clerkModalAuth } from "@/lib/clerk-modal-auth";

type Props = {
  /** Kept for route compatibility; sign-in modal handles new users via Clerk transfer. */
  mode?: "sign-in" | "sign-up";
};

/** Opens the sign-in modal (new accounts are created via Clerk's sign-in → sign-up transfer). */
export function AuthModalLauncher(_props: Props) {
  const { loaded, openSignIn } = useClerk();
  const searchParams = useSearchParams();
  const redirectUrl =
    searchParams.get("redirect_url") ??
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ??
    clerkModalAuth.forceRedirectUrl;

  useEffect(() => {
    if (!loaded) return;

    openSignIn({
      ...clerkModalAuth,
      forceRedirectUrl: redirectUrl,
      signUpForceRedirectUrl: redirectUrl,
    });
  }, [loaded, openSignIn, redirectUrl]);

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-cloud-canvas" aria-hidden />
  );
}
