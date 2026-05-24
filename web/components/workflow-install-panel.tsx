"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IconTooltipButton } from "@/components/icon-tooltip-button";

const FEEDBACK_MS = 2000;

type Props = {
  pullCmd: string;
};

export function WorkflowInstallPanel({ pullCmd }: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pullCmd);
      toast.success("Copied to clipboard");
      if (timerRef.current) clearTimeout(timerRef.current);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), FEEDBACK_MS);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-cards)] border border-cloud-canvas bg-white px-4 py-3.5">
      <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] leading-snug text-ink-black sm:text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pullCmd}
      </pre>
      <IconTooltipButton
        tooltip={copied ? "Copied" : "Copy command"}
        hideTooltip={copied}
        aria-label="Copy install command"
        onClick={() => void copy()}
      >
        {copied ? (
          <Check className="size-4" strokeWidth={2} aria-hidden />
        ) : (
          <Copy className="size-4" strokeWidth={1.75} aria-hidden />
        )}
      </IconTooltipButton>
    </div>
  );
}
