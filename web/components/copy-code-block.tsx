"use client";

import { Check, Copy, Download, Upload, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IconTooltipButton } from "@/components/icon-tooltip-button";
import { PublishWorkflowDialog } from "@/components/publish-workflow-dialog";
import { downloadTextFile } from "@/lib/workflow-filename";

const FEEDBACK_MS = 2000;

type Props = {
  code: string;
  label?: string;
  variant?: "elevated" | "chat";
  /** When set, shows a Download button that saves `code` to this filename. */
  downloadFilename?: string;
  /** When true, shows Publish to open the registry publish dialog. */
  publishable?: boolean;
};

type IconFeedbackButtonProps = {
  tooltip: string;
  ariaLabel: string;
  successToast: string;
  icon: LucideIcon;
  onAction: () => void | Promise<void>;
};

function IconFeedbackButton({
  tooltip,
  ariaLabel,
  successToast,
  icon: Icon,
  onAction,
}: IconFeedbackButtonProps) {
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleClick = async () => {
    try {
      await onAction();
      toast.success(successToast);
      if (timerRef.current) clearTimeout(timerRef.current);
      setDone(true);
      timerRef.current = setTimeout(() => setDone(false), FEEDBACK_MS);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <IconTooltipButton
      tooltip={tooltip}
      hideTooltip={done}
      aria-label={ariaLabel}
      onClick={() => void handleClick()}
    >
      {done ? (
        <Check className="size-4" strokeWidth={2} aria-hidden />
      ) : (
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      )}
    </IconTooltipButton>
  );
}

export function CopyCodeBlock({
  code,
  label = "code",
  variant = "elevated",
  downloadFilename,
  publishable = false,
}: Props) {
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <>
      <div
        className={`code-card text-left${variant === "chat" ? " code-card--chat" : ""}`}
      >
        <div className="code-card-header">
          <span className="text-caption text-slate-gray">{label}</span>
          <div className="flex items-center gap-0.5">
            <IconFeedbackButton
              tooltip="Copy"
              ariaLabel="Copy code"
              successToast="Copied to clipboard"
              icon={Copy}
              onAction={() => navigator.clipboard.writeText(code)}
            />
            {downloadFilename && (
              <IconFeedbackButton
                tooltip="Download"
                ariaLabel={`Download ${downloadFilename}`}
                successToast={`Downloaded ${downloadFilename}`}
                icon={Download}
                onAction={() => downloadTextFile(code, downloadFilename)}
              />
            )}
            {publishable && (
              <IconTooltipButton
                tooltip="Publish"
                aria-label="Publish workflow to registry"
                onClick={() => setPublishOpen(true)}
              >
                <Upload className="size-4" strokeWidth={1.75} aria-hidden />
              </IconTooltipButton>
            )}
          </div>
        </div>
        <pre className="code-card-body overflow-x-auto">{code}</pre>
      </div>

      {publishable && (
        <PublishWorkflowDialog
          open={publishOpen}
          yaml={code}
          onClose={() => setPublishOpen(false)}
        />
      )}
    </>
  );
}
