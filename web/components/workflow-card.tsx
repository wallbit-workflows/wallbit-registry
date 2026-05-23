import Link from "next/link";
import type { ListItem } from "@/lib/types";

type Props = {
  item: ListItem;
};

export function WorkflowCard({ item }: Props) {
  const href = `/workflows/${item.username}/${item.slug}`;
  const name = item.display_name || item.slug;
  const description =
    item.description || "Workflow for wallbit-cli.";

  return (
    <Link href={href} className="workflow-card group">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-[22px] font-medium leading-tight tracking-[-0.02em] text-ink-black group-hover:text-fire-orange sm:text-[24px] sm:leading-[1.2]">
          {name}
        </h3>
        <span className="tag-pill shrink-0 px-2.5 py-1 font-mono text-[13px]">
          v{item.version}
        </span>
      </div>
      <p className="font-mono text-[13px] text-stone-gray">
        {item.username}/{item.slug}
      </p>
      <p className="line-clamp-3 flex-1 text-[15px] leading-[1.6] text-slate-gray">
        {description}
      </p>
      <p className="text-[13px] font-medium text-silver-mist">
        by {item.username}
      </p>
    </Link>
  );
}
