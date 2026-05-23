"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { ListItem } from "@/lib/types";
import { HeroSection } from "./hero-section";
import { WorkflowCard } from "./workflow-card";

type Props = {
  items: ListItem[];
};

type SortKey = "recent" | "name";

function workflowCountLabel(filtered: number, total: number) {
  if (filtered !== total) {
    return `${filtered} of ${total} workflows`;
  }
  return total === 1 ? "1 workflow" : `${total} workflows`;
}

export function RegistryHome({ items }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter(
        (w) =>
          w.slug.toLowerCase().includes(q) ||
          w.display_name.toLowerCase().includes(q) ||
          w.username.toLowerCase().includes(q) ||
          (w.description?.toLowerCase().includes(q) ?? false),
      );
    }
    if (sort === "name") {
      list = [...list].sort((a, b) =>
        (a.display_name || a.slug).localeCompare(b.display_name || b.slug),
      );
    }
    return list;
  }, [items, query, sort]);

  return (
    <>
      <HeroSection query={query} onQueryChange={setQuery} />

      <section id="workflows" className="pb-24 pt-12 sm:pt-16">
        <div className="page-wrap">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-display text-ink-black">Workflows</h2>
              <p className="mt-1.5 text-sm text-slate-gray tabular-nums">
                {workflowCountLabel(filtered.length, items.length)}
              </p>
            </div>
            <div className="relative w-full sm:w-auto sm:min-w-[11.5rem]">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full cursor-pointer appearance-none rounded-full border border-cloud-canvas bg-white py-2.5 pl-4 pr-9 text-sm font-medium text-ink-black shadow-[var(--shadow-feature)] transition-[border-color,box-shadow] hover:border-frost-gray focus:border-code-blue/25 focus:outline-none focus:ring-[3px] focus:ring-code-blue/[0.08]"
                aria-label="Sort workflows"
              >
                <option value="recent">Recently published</option>
                <option value="name">Name (A–Z)</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-silver-mist"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-16 py-12 text-center text-sm text-stone-gray">
              No workflows match your search.
            </p>
          ) : (
            <div className="mt-10 grid gap-element sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <WorkflowCard
                  key={`${item.username}/${item.slug}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
