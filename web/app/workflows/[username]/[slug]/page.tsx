import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CLIBlock } from "@/components/cli-block";
import { downloadWorkflowURL, getWorkflowMetadata } from "@/lib/api";

type Props = {
  params: Promise<{ username: string; slug: string }>;
};

export default async function WorkflowPage({ params }: Props) {
  const { username, slug } = await params;

  let meta;
  try {
    meta = await getWorkflowMetadata(username, slug);
  } catch {
    notFound();
  }

  const pullCmd = `wallbit workflow pull ${username}/${slug} -o ${slug}.yaml`;
  const download = downloadWorkflowURL(username, slug);
  const name = meta.display_name || meta.slug;

  return (
    <>
      <SiteHeader />
      <main className="bg-cloud-canvas pb-24 pt-12">
        <div className="page-wrap">
          <Link
            href="/#workflows"
            className="text-sm font-medium text-stone-gray hover:text-ink-black"
          >
            ← All workflows
          </Link>

          <header className="mt-8 max-w-3xl">
            <div className="stack-sm">
              <p className="text-caption text-slate-gray">Workflow</p>
              <h1 className="text-heading-lg text-ink-black">{name}</h1>
              <p className="font-mono text-sm text-stone-gray">
                {username}/{slug}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-element">
              <span className="tag-pill font-mono">v{meta.version}</span>
              <span className="tag-pill">{meta.username}</span>
              <span className="tag-pill">
                {new Date(meta.published_at).toLocaleDateString()}
              </span>
            </div>
          </header>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
            <div className="stack-lg min-w-0">
              <section className="stack-sm">
                <h2 className="text-subheading text-ink-black">Install</h2>
                <p className="text-sm text-slate-gray">
                  Pull the latest published version into your project.
                </p>
                <CLIBlock command={pullCmd} />
              </section>

              <section className="feature-card stack-sm">
                <h2 className="text-subheading text-ink-black">Description</h2>
                {meta.description ? (
                  <p className="text-[15px] leading-[1.6] text-slate-gray">
                    {meta.description}
                  </p>
                ) : (
                  <p className="text-sm text-silver-mist">
                    No description provided.
                  </p>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="panel-elevated stack-sm">
                <a href={download} className="btn-primary w-full text-center">
                  Download YAML
                </a>
                <p className="text-center text-xs text-slate-gray">
                  Or use the install command
                </p>

                <dl className="stack-sm border-t border-cloud-canvas pt-4 text-sm">
                  <div>
                    <dt className="text-caption text-slate-gray">Version</dt>
                    <dd className="mt-1 font-mono font-medium text-ink-black">
                      {meta.version}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-caption text-slate-gray">Author</dt>
                    <dd className="mt-1 text-ink-black">{meta.username}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-slate-gray">Published</dt>
                    <dd className="mt-1 text-slate-gray">
                      {new Date(meta.published_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-caption text-slate-gray">Digest</dt>
                    <dd className="mt-1 font-mono text-xs leading-relaxed break-all text-stone-gray">
                      {meta.digest}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
