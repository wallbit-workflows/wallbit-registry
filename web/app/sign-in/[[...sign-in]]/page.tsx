import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { safeRedirectPath } from "@/lib/safe-redirect";

type Props = {
  searchParams: Promise<{ redirect_url?: string }>;
};

/**
 * Clerk OAuth lands here when the Dashboard sign-in URL is /sign-in.
 * Navbar still uses the modal; this route exists for OAuth + loop breaking only.
 */
export default async function SignInPage({ searchParams }: Props) {
  const { redirect_url } = await searchParams;
  const afterAuth = safeRedirectPath(redirect_url);

  // Break infinite redirect_url nesting — send home and open modal via query.
  if (redirect_url?.includes("/sign-in") || redirect_url?.includes("/sign-up")) {
    redirect(
      afterAuth === "/account"
        ? "/?openSignIn=1"
        : `/?openSignIn=1&redirect_url=${encodeURIComponent(afterAuth)}`,
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-cloud-canvas px-4 py-12">
        <SignIn
          appearance={clerkAppearance}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-in"
          forceRedirectUrl={afterAuth}
          fallbackRedirectUrl={afterAuth}
        />
      </main>
    </>
  );
}
