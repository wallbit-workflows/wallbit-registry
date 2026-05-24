"use client";

import { ArrowUp, Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  fileToAttachment,
  isAllowedStudioFile,
  type StudioAttachment,
} from "@/lib/studio-attachments";
import { StarterMarquee } from "@/components/starter-marquee";
import { WorkflowAttachmentChip } from "@/components/workflow-attachment-chip";
import { useStudioAuth } from "@/lib/use-studio-auth";

type Props = {
  input: string;
  onInputChange: (value: string) => void;
  attachments: StudioAttachment[];
  onAttachmentsChange: (attachments: StudioAttachment[]) => void;
  onSend: () => void;
  onReset?: () => void;
  streaming: boolean;
  showStarters: boolean;
  onStarterSelect: (prompt: string) => void;
  canReset: boolean;
};

export function StudioChatComposer({
  input,
  onInputChange,
  attachments,
  onAttachmentsChange,
  onSend,
  onReset,
  streaming,
  showStarters,
  onStarterSelect,
  canReset,
}: Props) {
  const { isLoaded, isSignedIn, promptSignIn, guardAction } = useStudioAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const canSend =
    isSignedIn &&
    !streaming &&
    (input.trim().length > 0 || attachments.length > 0);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setFileError(null);

    const next = [...attachments];
    for (const file of Array.from(files)) {
      if (!isAllowedStudioFile(file)) {
        setFileError("Only .yaml or .yml workflow files.");
        continue;
      }
      if (next.length >= 5) {
        setFileError("Maximum 5 attachments.");
        break;
      }
      try {
        next.push(await fileToAttachment(file));
      } catch {
        setFileError(`Could not read ${file.name}.`);
      }
    }
    onAttachmentsChange(next);
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className="stack-sm">
      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <li key={file.id} className="min-w-0 max-w-full">
              <WorkflowAttachmentChip
                name={file.name}
                variant="composer"
                onRemove={() => removeAttachment(file.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {fileError && (
        <p className="text-xs text-fire-orange">{fileError}</p>
      )}

      <div className="studio-composer-bar flex items-end gap-2 rounded-full border border-cloud-canvas bg-white px-2 py-2 shadow-[var(--shadow-feature)]">
        <input
          ref={fileRef}
          type="file"
          className="sr-only"
          multiple
          accept=".yaml,.yml,application/x-yaml,text/yaml,text/x-yaml"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-gray transition hover:bg-cloud-canvas hover:text-ink-black disabled:opacity-40"
          onClick={() =>
            guardAction(() => {
              fileRef.current?.click();
            })
          }
          disabled={streaming || !isLoaded}
          aria-label="Attach YAML workflow"
        >
          <Plus className="size-5" strokeWidth={1.75} aria-hidden />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          readOnly={!isSignedIn}
          onChange={(e) => {
            if (!isSignedIn) return;
            onInputChange(e.target.value);
            resizeTextarea();
          }}
          onFocus={() => {
            if (!isSignedIn) {
              textareaRef.current?.blur();
              promptSignIn();
            }
          }}
          onKeyDown={(e) => {
            if (!isSignedIn) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          disabled={streaming || !isLoaded}
          placeholder={
            isLoaded && !isSignedIn
              ? "Sign in to use Workflow Studio…"
              : "Describe your workflow…"
          }
          className="max-h-32 min-h-[40px] flex-1 cursor-text resize-none bg-transparent py-2.5 text-[15px] leading-snug text-ink-black placeholder:text-silver-mist focus:outline-none read-only:cursor-pointer"
          aria-label="Message"
        />

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fire-orange text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => guardAction(onSend)}
          disabled={!canSend}
          aria-label="Send message"
        >
          <ArrowUp className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {showStarters && (
        <StarterMarquee
          onSelect={(prompt) => guardAction(() => onStarterSelect(prompt))}
        />
      )}

      {canReset && onReset && (
        <button
          type="button"
          className="text-sm text-stone-gray hover:text-ink-black"
          onClick={onReset}
          disabled={streaming}
        >
          New conversation
        </button>
      )}
    </div>
  );
}
