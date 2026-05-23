import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cloud-canvas py-24">
        <div className="page-wrap flex justify-center">
          <div className="feature-card feature-card--roomy w-full max-w-md text-center stack-md">
            <h1 className="text-heading text-ink-black">Sign in</h1>
            <p className="text-sm leading-[1.54] text-slate-gray">
              Clerk integration coming next — set your username and create a
              registry API key for wallbit-cli.
            </p>
            <Link href="/" className="btn-ghost mx-auto">
              ← Back to registry
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
