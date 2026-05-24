import Link from "next/link";
import { WorkflowInstallPanel } from "@/components/workflow-install-panel";
import { WorkflowYamlPanel } from "@/components/workflow-yaml-panel";
import type { Metadata } from "@/lib/types";
import { avatarColor, initialsFor, previewFor } from "@/lib/workflow-visuals";

type Props = {
  meta: Metadata;
  username: string;
  slug: string;
  content: string;
  pullCmd: string;
};

function truncateDigest(digest: string) {
  if (digest.length <= 24) return digest;
  return `${digest.slice(0, 12)}…${digest.slice(-10)}`;
}

export function WorkflowDetail({
  meta,
  username,
  slug,
  content,
  pullCmd,
}: Props) {
  const title = meta.display_name || meta.slug;
  const description = meta.description?.trim();
  const workflowKey = `${username}/${slug}`;
  const preview = previewFor(workflowKey);
  const published = new Date(meta.published_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div>
        <Link
          href="/#workflows"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-gray transition hover:text-ink-black"
        >
          <span aria-hidden>←</span>
          All workflows
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <div className="min-w-0">
            <header className="flex flex-wrap items-start gap-5">
              <div
                className="flex size-[72px] shrink-0 items-center justify-center rounded-[var(--radius-cards)] sm:size-20"
                style={{ backgroundColor: preview }}
              >
                <img
                  src="/workflow.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="opacity-95"
                />
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <p className="text-caption text-slate-gray">Workflow</p>
                <h1 className="text-display mt-1 text-ink-black">{title}</h1>
                <p className="mt-2 font-mono text-[15px] text-stone-gray">
                  {workflowKey}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="tag-pill font-mono text-[13px]">
                    v{meta.version}
                  </span>
                  <span className="tag-pill">{published}</span>
                </div>
              </div>
            </header>

            {description ? (
              <p className="mt-8 max-w-2xl text-[16px] leading-[1.65] text-slate-gray">
                {description}
              </p>
            ) : (
              <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-silver-mist">
                No description yet. Set one when publishing or add{" "}
                <span className="font-mono text-stone-gray">description:</span> to
                your workflow YAML.
              </p>
            )}

            <section className="mt-10 stack-sm">
              <div>
                <h2 className="text-subheading text-ink-black">Install</h2>
                <p className="mt-1 text-sm text-slate-gray">
                  Pull this version with{" "}
                  <span className="font-mono text-stone-gray">wallbit-cli</span>.
                </p>
              </div>
              <WorkflowInstallPanel pullCmd={pullCmd} />
            </section>

            <div className="mt-10">
              <WorkflowYamlPanel
                content={content}
                filename={`${slug}.yaml`}
                version={meta.version}
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="feature-card feature-card--roomy stack-md">
              <h2 className="text-caption text-slate-gray">Publisher</h2>
              <div className="flex items-center gap-3">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: avatarColor(username) }}
                  aria-hidden
                >
                  {initialsFor(username)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink-black">{meta.username}</p>
                  <p className="font-mono text-xs text-stone-gray">
                    @{username}
                  </p>
                </div>
              </div>

              <dl className="stack-sm border-t border-cloud-canvas pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-gray">Version</dt>
                  <dd className="font-mono font-medium text-ink-black">
                    {meta.version}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-gray">Published</dt>
                  <dd className="text-ink-black">{published}</dd>
                </div>
                <div>
                  <dt className="text-slate-gray">Content hash</dt>
                  <dd
                    className="mt-1 break-all font-mono text-xs leading-relaxed text-stone-gray"
                    title={meta.digest}
                  >
                    {truncateDigest(meta.digest)}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-cloud-canvas pt-4">
                <Link
                  href="/studio"
                  className="text-sm font-medium text-code-blue hover:underline"
                >
                  Open Workflow Studio →
                </Link>
              </div>
            </div>
          </aside>
        </div>
    </div>
  );
}
