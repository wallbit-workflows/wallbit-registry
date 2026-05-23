"use client";

import { Check, FileUp, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { slugFromYaml } from "@/lib/workflow-filename";
import { readWorkflowYamlFile } from "@/lib/workflow-yaml";

type InputMode = "drop" | "paste";

/** Shared height for drop and paste zones */
const UPLOAD_ZONE_HEIGHT = "h-36";

type Props = {
  yaml: string;
  fileName: string | null;
  onYamlChange: (content: string, fileName: string | null) => void;
  disabled?: boolean;
};

export function PublishYamlUpload({
  yaml,
  fileName,
  onYamlChange,
  disabled = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>("drop");
  const [dragOver, setDragOver] = useState(false);

  const hasYaml = yaml.trim().length > 0;
  const workflowName = hasYaml ? slugFromYaml(yaml) : null;

  const loadFile = async (file: File) => {
    try {
      const text = await readWorkflowYamlFile(file);
      onYamlChange(text, file.name);
      setMode("drop");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
    }
  };

  const clearYaml = () => {
    onYamlChange("", null);
    setMode("drop");
  };

  const switchToPaste = () => {
    onYamlChange("", null);
    setMode("paste");
  };

  const switchToDrop = () => {
    if (!fileName) onYamlChange("", null);
    setMode("drop");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) void loadFile(file);
  };

  if (hasYaml) {
    return (
      <div className="rounded-[var(--radius-cards)] border border-cloud-canvas bg-cloud-canvas/30 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-fire-orange/10 text-fire-orange">
            <Check className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 stack-sm">
            <p className="text-sm font-medium text-ink-black">
              {fileName ?? "Pasted workflow"}
            </p>
            <p className="text-xs text-slate-gray">
              {workflowName && workflowName !== "workflow" && (
                <>
                  <span className="font-mono text-stone-gray">{workflowName}</span>
                  {" · "}
                </>
              )}
              {yaml.trim().split("\n").length} lines
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full p-1.5 text-silver-mist transition-colors hover:bg-white hover:text-ink-black"
            onClick={clearYaml}
            disabled={disabled}
            aria-label="Remove workflow"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml,text/yaml,text/x-yaml"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void loadFile(file);
        }}
      />

      {mode === "drop" ? (
        <div
          className={`relative overflow-hidden rounded-[var(--radius-cards)] border-2 border-dashed transition-colors ${UPLOAD_ZONE_HEIGHT} ${
            dragOver
              ? "border-code-blue/40 bg-code-blue/[0.04]"
              : "border-frost-gray bg-cloud-canvas/35"
          } ${disabled ? "pointer-events-none opacity-50" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <button
            type="button"
            className="absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 border-0 bg-transparent p-4 text-center transition-colors hover:bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-code-blue/20"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-paper-white shadow-[var(--shadow-feature)] text-stone-gray">
              <FileUp className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-sm font-medium text-ink-black">
              Drop YAML here or browse
            </span>
            <span className="text-xs text-slate-gray">
              .yaml · .yml · up to 256 KiB
            </span>
          </button>
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-[var(--radius-cards)] border-2 border-dashed border-frost-gray bg-cloud-canvas/35 ${UPLOAD_ZONE_HEIGHT} ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <textarea
            value={yaml}
            onChange={(e) => onYamlChange(e.target.value, null)}
            placeholder={"version: 1\nname: my-workflow\nsteps: …"}
            spellCheck={false}
            autoFocus
            disabled={disabled}
            className="box-border h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed text-ink-black placeholder:text-silver-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-code-blue/20"
          />
        </div>
      )}

      <p className="text-center">
        <button
          type="button"
          className="text-xs font-medium text-fire-orange hover:underline"
          onClick={mode === "drop" ? switchToPaste : switchToDrop}
          disabled={disabled}
        >
          {mode === "drop" ? "Paste YAML instead" : "Drop a file instead"}
        </button>
      </p>
    </div>
  );
}
