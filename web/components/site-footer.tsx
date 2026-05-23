import Link from "next/link";
import type { ReactNode } from "react";
import { WALLBIT_CLI_DOCS_URL } from "@/lib/links";

type FooterLinkProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
};

function FooterLink({ href, children, external }: FooterLinkProps) {
  const className =
    "text-[13px] font-medium leading-snug text-stone-gray transition-colors hover:text-ink-black";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-frost-gray/50 bg-cloud-canvas">
      <div className="page-wrap py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-md stack-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-black"
            >
              <img
                src="/logo.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0"
                aria-hidden
              />
              Wallbit Registry
            </Link>
            <p className="text-[13px] leading-relaxed text-slate-gray">
              Discover, install, and share YAML automations for wallbit-cli.
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:shrink-0 sm:justify-end sm:pt-0.5"
            aria-label="Footer"
          >
            <FooterLink href="/studio">Workflow Studio</FooterLink>
            <FooterLink href="/account">Publish</FooterLink>
            <FooterLink href={WALLBIT_CLI_DOCS_URL} external>
              wallbit-cli
            </FooterLink>
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-1.5 border-t border-cloud-canvas pt-5 text-[11px] text-silver-mist sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Wallbit Registry</p>
          <p>Built for the wallbit-cli community</p>
        </div>
      </div>
    </footer>
  );
}
