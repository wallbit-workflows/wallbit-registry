"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRegistryProfile } from "@/components/registry-profile-provider";

/** Sends signed-in users without a registry username to complete setup. */
export function RegistryUsernameGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { needsUsername, loading } = useRegistryProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || loading || !isSignedIn || !needsUsername) return;
    if (pathname.startsWith("/account")) return;
    if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return;

    if (pathname.startsWith("/studio")) {
      router.replace("/account?setup=username");
    }
  }, [isLoaded, isSignedIn, loading, needsUsername, pathname, router]);

  return null;
}
