import { HeroSearch } from "./hero-search";
import { WALLBIT_CLI_DOCS_URL } from "@/lib/links";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function HeroSection({ query, onQueryChange }: Props) {
  return (
    <section className="bg-cloud-canvas pb-16 pt-16 sm:pb-20 sm:pt-20">
      <div className="page-wrap text-center">
        <h1 className="text-display-lg mt-3 overflow-visible text-ink-black">
          Find and install
          <br />
          <span className="inline whitespace-nowrap">
            community
            <span
              className="relative inline-block h-[1.12em] w-[1.12em] translate-y-[0.07em] align-middle"
              aria-hidden
            >
              <img
                src="/workflow.svg"
                alt=""
                width={64}
                height={64}
                className="block h-full w-full opacity-90"
              />
            </span>
            workflows
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-gray">
          The registry for{" "}
          <a
            href={WALLBIT_CLI_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fire-orange underline decoration-fire-orange/35 underline-offset-[0.2em] transition hover:decoration-fire-orange"
          >
            wallbit-cli
          </a>{" "}
          workflows, built and shared by the community. Stop rebuilding the same
          automations from scratch.{" "}
        </p>
        <HeroSearch query={query} onQueryChange={onQueryChange} />
      </div>
    </section>
  );
}
