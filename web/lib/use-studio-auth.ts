"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useCallback } from "react";

export function useStudioAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const promptSignIn = useCallback(() => {
    openSignIn({
      forceRedirectUrl: "/studio",
      signUpForceRedirectUrl: "/studio",
    });
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
