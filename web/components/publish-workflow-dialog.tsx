"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  PublishWorkflowError,
  publishWorkflow,
} from "@/lib/publish-workflow";
import {
  clearRegistryApiKey,
  getRegistryApiKey,
  setRegistryApiKey,
} from "@/lib/registry-auth";
import { semverFromYaml, slugFromYaml } from "@/lib/workflow-filename";

type Props = {
  open: boolean;
  yaml: string;
  onClose: () => void;
  onPublished?: (result: { username: string; slug: string }) => void;
};

export function PublishWorkflowDialog({
  open,
  yaml,
  onClose,
  onPublished,
}: Props) {
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [slug, setSlug] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setApiKey(getRegistryApiKey() ?? "");
    setSlug(slugFromYaml(yaml));
    setVersion(semverFromYaml(yaml));
    setDescription("");
  }, [open, yaml]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, submitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      toast.error("Registry API key is required");
      return;
    }

    setSubmitting(true);
    try {
      const result = await publishWorkflow({
        apiKey: trimmedKey,
        slug: slug.trim(),
        version: version.trim(),
        description: description.trim() || undefined,
        content: yaml,
        username: username.trim() || undefined,
      });

      setRegistryApiKey(trimmedKey);
      onPublished?.({ username: result.username, slug: result.slug });

      toast.success("Workflow published", {
        description: `${result.username}/${result.slug}@${result.version}`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = `/workflows/${result.username}/${result.slug}`;
          },
        },
      });

      onClose();
    } catch (err) {
      if (err instanceof PublishWorkflowError) {
        if (err.status === 401) {
          toast.error("Invalid API key");
        } else if (err.status === 409) {
          toast.error("Version already exists — bump semver and try again");
        } else if (
          err.status === 400 &&
          err.message.toLowerCase().includes("username")
        ) {
          toast.error("Set your registry username below, then publish again");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Could not publish workflow");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="publish-dialog-overlay fixed inset-0 z-[200] flex items-center justify-center bg-ink-black/40 p-4"
      role="presentation"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-dialog-title"
        className="publish-dialog-panel w-full max-w-md max-h-[min(90vh,100%)] overflow-y-auto rounded-[var(--radius-cards)] bg-paper-white text-ink-black shadow-[var(--shadow-feature)]"
        onClick={(e) => e.stopPropagation()}
      >
        <form className="stack-md p-6" onSubmit={(e) => void handleSubmit(e)}>
          <div className="stack-sm">
            <h2
              id="publish-dialog-title"
              className="text-heading text-lg font-semibold"
            >
              Publish workflow
            </h2>
            <p className="text-sm text-slate-gray">
              Publishes to the Wallbit registry with your API key (
              <code className="rounded bg-cloud-canvas px-1 font-mono text-xs">
                wb_reg_…
              </code>
              ). Run{" "}
              <code className="rounded bg-cloud-canvas px-1 font-mono text-xs">
                go run ./cmd/seed
              </code>{" "}
              locally to create one.
            </p>
          </div>

          <label className="stack-sm block text-sm">
            <span className="font-medium">Registry API key</span>
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="wb_reg_…"
              className="w-full rounded-[var(--radius-inputs)] border border-cloud-canvas bg-white px-3 py-2 font-mono text-sm focus:border-code-blue focus:outline-none"
              required
            />
            {apiKey && (
              <button
                type="button"
                className="text-left text-xs text-stone-gray hover:text-ink-black"
                onClick={() => {
                  clearRegistryApiKey();
                  setApiKey("");
                }}
              >
                Clear saved key
              </button>
            )}
          </label>

          <label className="stack-sm block text-sm">
            <span className="font-medium">Username</span>
            <span className="text-xs text-slate-gray ml-1">
              Required on first publish if not set yet
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-handle"
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?"
              className="w-full rounded-[var(--radius-inputs)] border border-cloud-canvas bg-white px-3 py-2 text-sm focus:border-code-blue focus:outline-none"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="stack-sm block text-sm">
              <span className="font-medium">Slug</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full rounded-[var(--radius-inputs)] border border-cloud-canvas bg-white px-3 py-2 font-mono text-sm focus:border-code-blue focus:outline-none"
              />
            </label>
            <label className="stack-sm block text-sm">
              <span className="font-medium">Version</span>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
                placeholder="1.0.0"
                className="w-full rounded-[var(--radius-inputs)] border border-cloud-canvas bg-white px-3 py-2 font-mono text-sm focus:border-code-blue focus:outline-none"
              />
            </label>
          </div>

          <label className="stack-sm block text-sm">
            <span className="font-medium">Description</span>
            <span className="text-xs text-slate-gray ml-1">Optional</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[var(--radius-inputs)] border border-cloud-canvas bg-white px-3 py-2 text-sm focus:border-code-blue focus:outline-none"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn-ghost px-4 py-2 text-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
