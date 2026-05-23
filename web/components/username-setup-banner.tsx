"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRegistryProfile } from "@/components/registry-profile-provider";

export function UsernameSetupBanner() {
  const { isSignedIn } = useAuth();
  const { needsUsername, loading } = useRegistryProfile();

  if (!isSignedIn || loading || !needsUsername) {
    return null;
  }

  return (
    <div
      className="page-wrap py-3"
      role="status"
    >
      <div className="flex flex-col gap-3 rounded-[var(--radius-cards)] border border-fire-orange/25 bg-paper-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-gray">
          <span className="font-medium text-ink-black">Choose a username</span>{" "}
          to publish workflows and appear in URLs (
          <span className="font-mono text-stone-gray">you/slug</span>).
        </p>
        <Link href="/account?setup=username" className="btn-primary w-fit shrink-0 text-sm">
          Set username
        </Link>
      </div>
    </div>
  );
}
