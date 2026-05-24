import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WorkflowDetail } from "@/components/workflow-detail";
import { getWorkflowContent, getWorkflowMetadata } from "@/lib/api";

type Props = {
  params: Promise<{ username: string; slug: string }>;
};

export default async function WorkflowPage({ params }: Props) {
  const { username, slug } = await params;

  let meta;
  let content: string;
  try {
    meta = await getWorkflowMetadata(username, slug);
    content = await getWorkflowContent(username, slug, meta.version);
  } catch {
    notFound();
  }

  const pullCmd = `wallbit workflow pull ${username}/${slug}@${meta.version} -o ${slug}.yaml`;

  return (
    <>
      <SiteHeader />
      <main className="bg-cloud-canvas pb-24 pt-10 sm:pt-14">
        <div className="page-wrap max-w-6xl">
          <WorkflowDetail
            meta={meta}
            username={username}
            slug={slug}
            content={content}
            pullCmd={pullCmd}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
