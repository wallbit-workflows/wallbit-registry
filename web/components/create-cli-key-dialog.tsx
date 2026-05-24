"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { rememberIssuedKeyToken } from "@/lib/cli-issued-keys";

export type ApiKeyCreated = {
  id: string;
  token: string;
  prefix: string;
  name?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKeyCreated) => void;
};

export function CreateCliKeyDialog({ open, onClose, onCreated }: Props) {
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLabel("");
    setCreating(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creating) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, creating, onClose]);

  const createKey = async () => {
    setCreating(true);
    try {
      const name = label.trim() || "wallbit-cli";
      const res = await fetch("/api/registry/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as ApiKeyCreated & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create API key");
      }
      if (!data.token?.trim() || !data.prefix?.trim()) {
        throw new Error("Invalid API response — redeploy the registry API");
      }
      rememberIssuedKeyToken(data.token, {
        id: data.id,
        prefix: data.prefix,
      });
      onCreated(data);
      onClose();
      try {
        await navigator.clipboard.writeText(data.token);
        toast.success("Key created and copied");
      } catch {
        toast.success("Key created — use copy in the list");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="publish-dialog-overlay fixed inset-0 z-[200] flex items-center justify-center bg-ink-black/40 p-4"
      role="presentation"
      onClick={() => {
        if (!creating) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-cli-key-title"
        className="publish-dialog-panel w-full max-w-sm rounded-[var(--radius-cards)] bg-paper-white p-6 text-ink-black shadow-[var(--shadow-feature)]"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          className="stack-md"
          onSubmit={(e) => {
            e.preventDefault();
            void createKey();
          }}
        >
          <div className="stack-sm">
            <h2
              id="create-cli-key-title"
              className="text-heading text-lg font-semibold"
            >
              New CLI key
            </h2>
            <p className="text-sm text-slate-gray">
              Optional name to tell keys apart (laptop, CI, …).
            </p>
          </div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-field w-full"
            placeholder="laptop, ci, …"
            maxLength={64}
            autoFocus
            disabled={creating}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-ghost px-4 py-2 text-sm"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
              disabled={creating}
            >
              {creating && <Loader2 className="size-4 animate-spin" />}
              {creating ? "Creating…" : "Create key"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
