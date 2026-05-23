"use client";

import { Search } from "lucide-react";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function HeroSearch({ query, onQueryChange }: Props) {
  return (
    <div className="mx-auto mt-10 w-full max-w-lg">
      <label className="flex cursor-text items-center gap-3 rounded-full border border-cloud-canvas bg-white px-4 py-3 shadow-[var(--shadow-feature)] transition-[box-shadow,border-color] focus-within:border-code-blue/25 focus-within:shadow-[var(--shadow-feature),0_0_0_3px_rgba(0,111,255,0.08)]">
        <Search
          className="size-[18px] shrink-0 text-silver-mist"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search workflows…"
          className="min-w-0 flex-1 bg-transparent text-[15px] leading-snug text-ink-black placeholder:text-silver-mist focus:outline-none"
          aria-label="Search workflows"
        />
      </label>
    </div>
  );
}
