"use client";

import { Loader2 } from "lucide-react";
import { PublishYamlUpload } from "@/components/publish-yaml-upload";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  PublishWorkflowError,
  publishWorkflow,
} from "@/lib/publish-workflow";
import { useRegistryProfile } from "@/components/registry-profile-provider";
import {
  descriptionFromYaml,
  semverFromYaml,
  slugFromYaml,
} from "@/lib/workflow-filename";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When omitted, the user must upload or paste YAML. */
  yaml?: string;
  onPublished?: (result: { username: string; slug: string }) => void;
};

export function PublishWorkflowDialog({
  open,
  yaml: yamlProp,
  onClose,
  onPublished,
}: Props) {
  const router = useRouter();
  const uploadMode = yamlProp === undefined;

  const [yamlContent, setYamlContent] = useState("");
  const [yamlFileName, setYamlFileName] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { needsUsername } = useRegistryProfile();

  const applyYamlToFields = (content: string) => {
    setYamlContent(content);
    setSlug(slugFromYaml(content));
    setVersion(semverFromYaml(content));
    setDescription(descriptionFromYaml(content));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setYamlFileName(null);

    if (uploadMode) {
      setYamlContent("");
      setSlug("workflow");
      setVersion("1.0.0");
    } else {
      applyYamlToFields(yamlProp);
    }
  }, [open, yamlProp, uploadMode]);

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
    const content = yamlContent.trim();
    if (!content) {
      toast.error("Workflow YAML is required");
      return;
    }

    if (needsUsername) return;

    setSubmitting(true);
    try {
      const result = await publishWorkflow({
        slug: slug.trim(),
        version: version.trim(),
        description: description.trim() || undefined,
        content,
      });
      onPublished?.({ username: result.username, slug: result.slug });
      router.refresh();

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
          toast.error("Sign in to publish workflows");
        } else if (err.status === 409) {
          toast.error("Version already exists — bump semver and try again");
        } else if (
          err.status === 400 &&
          err.message.toLowerCase().includes("username")
        ) {
          toast.error("Set your registry username in Account, then publish again");
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

  const hasYaml = yamlContent.trim().length > 0;

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
        className={`publish-dialog-panel w-full max-h-[min(90vh,100%)] overflow-y-auto rounded-[var(--radius-cards)] bg-paper-white text-ink-black shadow-[var(--shadow-feature)] ${uploadMode ? "max-w-lg" : "max-w-md"}`}
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
              {uploadMode ? (
                <>
                  Upload or paste a{" "}
                  <span className="font-mono text-stone-gray">wallbit-cli</span>{" "}
                  workflow YAML. You are publishing as your signed-in account.
                </>
              ) : (
                <>Publish this workflow to the Wallbit registry.</>
              )}
            </p>
          </div>

          {needsUsername ? (
            <div className="rounded-[var(--radius-inputs)] border border-pale-sienna bg-paper-white px-4 py-4 stack-sm">
              <p className="text-sm text-ink-black">
                Choose a registry username before you can publish. It appears in
                public URLs like{" "}
                <span className="font-mono text-stone-gray">username/slug</span>
                .
              </p>
              <p className="text-sm text-slate-gray">
                Set it once in Account, then come back to publish.
              </p>
            </div>
          ) : (
            <>
              {uploadMode && (
                <PublishYamlUpload
                  yaml={yamlContent}
                  fileName={yamlFileName}
                  disabled={submitting}
                  onYamlChange={(content, name) => {
                    applyYamlToFields(content);
                    setYamlFileName(name);
                  }}
                />
              )}

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
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn-ghost px-4 py-2 text-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            {needsUsername ? (
              <Link
                href="/account?setup=username"
                className="btn-primary px-4 py-2 text-sm"
                onClick={onClose}
              >
                Set username in Account
              </Link>
            ) : (
              <button
                type="submit"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
                disabled={submitting || (uploadMode && !hasYaml)}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Publish
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
