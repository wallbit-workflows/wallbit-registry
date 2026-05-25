import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { safeRedirectPath } from "@/lib/safe-redirect";

type Props = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignInSSOCallbackPage({ searchParams }: Props) {
  const { redirect_url } = await searchParams;
  const afterAuth = safeRedirectPath(redirect_url);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cloud-canvas px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Loader2
          className="size-10 animate-spin text-fire-orange"
          aria-hidden
        />
        <p className="text-sm text-slate-gray">Completing sign in…</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={afterAuth}
        signUpForceRedirectUrl={afterAuth}
        signInFallbackRedirectUrl={afterAuth}
        signUpFallbackRedirectUrl={afterAuth}
        transferable
      />
      <div id="clerk-captcha" />
    </main>
  );
}
