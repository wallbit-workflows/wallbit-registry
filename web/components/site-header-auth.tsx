"use client";

import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function SiteHeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <span className="h-8 w-20" aria-hidden />;
  }

  if (!isSignedIn) {
    return (
      <>
        <SignInButton mode="modal" appearance={clerkAppearance}>
          <button type="button" className="nav-link">
            Sign in
          </button>
        </SignInButton>
        <SignInButton
          mode="modal"
          appearance={clerkAppearance}
          forceRedirectUrl="/account"
        >
          <button type="button" className="btn-primary">
            Publish
          </button>
        </SignInButton>
      </>
    );
  }

  return (
    <>
      <Link href="/account" className="nav-link hidden sm:inline">
        Account
      </Link>
      <Link href="/account" className="btn-primary">
        Publish
      </Link>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          ...clerkAppearance,
          elements: {
            ...clerkAppearance.elements,
            avatarBox: "h-8 w-8",
          },
        }}
      />
    </>
  );
}
