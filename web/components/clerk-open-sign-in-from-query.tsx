"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { safeRedirectPath } from "@/lib/safe-redirect";

/** Opens the sign-in modal when redirected from a broken /sign-in loop (?openSignIn=1). */
export function ClerkOpenSignInFromQuery() {
  const { loaded, openSignIn } = useClerk();
  const searchParams = useSearchParams();
  const router = useRouter();
  const opened = useRef(false);

  useEffect(() => {
    if (!loaded || opened.current) return;
    if (searchParams.get("openSignIn") !== "1") return;

    opened.current = true;
    const afterAuth = safeRedirectPath(
      searchParams.get("redirect_url") ?? undefined,
    );

    openSignIn({
      forceRedirectUrl: afterAuth,
      signUpForceRedirectUrl: afterAuth,
    });

    const next = new URLSearchParams(searchParams.toString());
    next.delete("openSignIn");
    next.delete("redirect_url");
    const qs = next.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }, [loaded, openSignIn, searchParams, router]);

  return null;
}
