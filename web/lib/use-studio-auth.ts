"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useCallback } from "react";
import { clerkModalAuthWithRedirect } from "@/lib/clerk-modal-auth";

export function useStudioAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const promptSignIn = useCallback(() => {
    openSignIn(clerkModalAuthWithRedirect("/studio"));
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
