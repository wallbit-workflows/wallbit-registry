"use client";

import { FileCode2, X } from "lucide-react";

type Props = {
  name: string;
  onRemove?: () => void;
  variant?: "composer" | "message";
};

export function WorkflowAttachmentChip({
  name,
  onRemove,
  variant = "composer",
}: Props) {
  const isMessage = variant === "message";

  return (
    <div
      className={
        isMessage
          ? "inline-flex w-auto max-w-[min(100%,13.5rem)] items-center gap-2 rounded-lg border border-cloud-canvas bg-cloud-canvas/50 px-2 py-1.5"
          : "inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-xl border border-cloud-canvas bg-paper-white py-2 pl-2.5 pr-2 shadow-[var(--shadow-feature)]"
      }
    >
      <span
        className={
          isMessage
            ? "flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-code-blue shadow-[var(--shadow-feature)]"
            : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-cloud-canvas text-code-blue"
        }
        aria-hidden
      >
        <FileCode2
          className={isMessage ? "size-3.5" : "size-3.5"}
          strokeWidth={1.75}
        />
      </span>

      <div className="min-w-0">
        <p
          className={
            isMessage
              ? "max-w-[9.5rem] truncate font-mono text-xs font-medium text-ink-black"
              : "max-w-[200px] truncate font-mono text-xs font-medium text-ink-black"
          }
          title={name}
        >
          {name}
        </p>
        {!isMessage && (
          <p className="text-[11px] text-slate-gray">YAML workflow</p>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-silver-mist transition hover:bg-cloud-canvas hover:text-ink-black"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
