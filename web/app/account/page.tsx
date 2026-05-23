import { AccountSettings } from "@/components/account-settings";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Account — Wallbit Registry",
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cloud-canvas py-16 sm:py-20">
        <div className="page-wrap">
          <div className="mx-auto max-w-2xl stack-md">
            <div>
              <h1 className="text-display text-ink-black">Account</h1>
              <p className="mt-2 text-lg leading-relaxed text-slate-gray">
                Set your username and create a registry API key for wallbit-cli.
              </p>
            </div>
            <AccountSettings />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
