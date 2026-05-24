"use client";

import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { PublishWorkflowDialog } from "@/components/publish-workflow-dialog";
import { useRegistryProfile } from "@/components/registry-profile-provider";
import {
  SiteHeaderAuthSkeleton,
  SiteHeaderAuthSkeletonSignedOut,
} from "@/components/site-header-auth-skeleton";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { clerkModalAuth } from "@/lib/clerk-modal-auth";
import {
  headerNavCtaButton,
  headerNavTextButton,
} from "@/lib/header-nav-classes";

const userButtonAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    avatarBox: "h-9 w-9 ring-1 ring-cloud-canvas",
    userButtonTrigger: "rounded-full focus:shadow-none",
    userButtonPopoverCard: "shadow-[var(--shadow-feature)]",
  },
};

export function SiteHeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const { loading: profileLoading, needsUsername } = useRegistryProfile();
  const [publishOpen, setPublishOpen] = useState(false);

  if (!isLoaded) {
    return <SiteHeaderAuthSkeletonSignedOut />;
  }

  if (!isSignedIn) {
    return (
      <>
        <SignInButton
          mode="modal"
          appearance={clerkModalAuth.appearance}
          oauthFlow={clerkModalAuth.oauthFlow}
        >
          <button type="button" className={headerNavTextButton}>
            Sign in
          </button>
        </SignInButton>
        <SignInButton
          mode="modal"
          appearance={clerkModalAuth.appearance}
          oauthFlow={clerkModalAuth.oauthFlow}
          forceRedirectUrl={clerkModalAuth.forceRedirectUrl}
        >
          <button type="button" className={headerNavCtaButton}>
            Publish
          </button>
        </SignInButton>
      </>
    );
  }

  if (profileLoading) {
    return <SiteHeaderAuthSkeleton />;
  }

  return (
    <>
      {needsUsername ? (
        <Link href="/account?setup=username" className={headerNavCtaButton}>
          Publish
        </Link>
      ) : (
        <button
          type="button"
          className={headerNavCtaButton}
          onClick={() => setPublishOpen(true)}
        >
          Publish
        </button>
      )}
      <div className="ml-1 flex items-center">
        <UserButton
          userProfileUrl="/account"
          userProfileMode="navigation"
          appearance={userButtonAppearance}
        />
      </div>
      <PublishWorkflowDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
      />
    </>
  );
}
