"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useCallback } from "react";
import { clerkModalAuth } from "@/lib/clerk-modal-auth";

const studioRedirect = {
  ...clerkModalAuth,
  forceRedirectUrl: "/studio",
  signInForceRedirectUrl: "/studio",
  signUpForceRedirectUrl: "/studio",
};

export function useStudioAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const promptSignIn = useCallback(() => {
    openSignIn(studioRedirect);
  }, [openSignIn]);

  const guardAction = useCallback(
    (action: () => void) => {
      if (!isLoaded) return;
      if (!isSignedIn) {
        promptSignIn();
        return;
      }
      action();
    },
    [isLoaded, isSignedIn, promptSignIn],
  );

  return { isLoaded, isSignedIn, promptSignIn, guardAction };
}
