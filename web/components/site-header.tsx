import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-cloud-canvas bg-cloud-canvas/90 backdrop-blur-md">
      <div className="page-wrap flex h-16 items-center justify-between gap-element">
        <Link
          href="/"
          className="flex items-center gap-element font-bold text-ink-black"
        >
          <img
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            aria-hidden
          />
          Wallbit Registry
        </Link>

        <nav className="flex items-center gap-element">
          <Link href="/studio" className="nav-link hidden sm:inline">
            Workflow Studio
          </Link>
          <Link href="/sign-in" className="nav-link">
            Sign in
          </Link>
          <Link href="/sign-in" className="btn-primary">
            Publish
          </Link>
        </nav>
      </div>
    </header>
  );
}
