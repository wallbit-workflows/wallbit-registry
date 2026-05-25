"use client";

import { useAuth, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";

const FIELD_LABELS: Record<string, string> = {
  username: "Username",
  first_name: "First name",
  last_name: "Last name",
};

export default function SignInContinuePage() {
  const router = useRouter();
  const { isLoaded: authLoaded } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoaded || fetchStatus === "fetching" || !signUp) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-[calc(100dvh-4rem)] bg-cloud-canvas py-16">
          <p className="page-wrap text-slate-gray">Loading…</p>
        </main>
      </>
    );
  }

  if (signUp.status === "complete") {
    router.replace("/account");
    return null;
  }

  const fields = signUp.missingFields ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const updates: Record<string, string> = {};
      for (const field of fields) {
        const value = form.get(field);
        if (typeof value !== "string" || !value.trim()) continue;
        const key =
          field === "first_name"
            ? "firstName"
            : field === "last_name"
              ? "lastName"
              : field;
        updates[key] = value.trim();
      }
      await signUp.update(updates);

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: async ({ decorateUrl }) => {
            const url = decorateUrl("/account");
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.replace(url);
            }
          },
        });
        return;
      }

      if (signUp.status !== "missing_requirements") {
        setError("Could not finish sign-up. Try signing in again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100dvh-4rem)] bg-cloud-canvas py-16 sm:py-20">
        <div className="page-wrap mx-auto max-w-md">
          <h1 className="text-display text-ink-black">Finish sign-up</h1>
          <p className="mt-2 text-slate-gray">
            A few more details to create your account.
          </p>

          {fields.length === 0 ? (
            <p className="mt-6 text-slate-gray">
              Nothing else is required.{" "}
              <button
                type="button"
                className="text-fire-orange underline"
                onClick={() => router.replace("/sign-in")}
              >
                Back to sign in
              </button>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 stack-md">
              {fields.map((field) => (
                <label key={field} className="stack-sm block">
                  <span className="text-sm font-medium text-ink-black">
                    {FIELD_LABELS[field] ?? field}
                  </span>
                  <input
                    name={field}
                    required
                    autoComplete="off"
                    className="w-full rounded-xl border border-cloud-canvas bg-paper-white px-4 py-3 text-ink-black shadow-[var(--shadow-feature)] focus:outline-none focus:ring-2 focus:ring-fire-orange/30"
                  />
                </label>
              ))}
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Continue"}
              </button>
            </form>
          )}

          <div id="clerk-captcha" className="mt-4" />
        </div>
      </main>
    </>
  );
}
