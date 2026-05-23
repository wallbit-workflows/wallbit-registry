export function StudioHero() {
  return (
    <section className="relative overflow-hidden pb-12 pt-16 sm:pb-14 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_-15%,rgba(255,77,0,0.14),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-frost-gray) 1px, transparent 1px), linear-gradient(90deg, var(--color-frost-gray) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
        }}
      />

      <div className="page-wrap relative text-center">

        <h1 className="text-display-lg mt-3 overflow-visible text-ink-black">
          Create and refine your
          <br />
          <span className="text-fire-orange">wallbit-cli workflows</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-gray">
          Workflow Studio turns a plain description into a valid workflow —
          whether you are starting from scratch or improving something you
          already run in production.
        </p>
      </div>
    </section>
  );
}
