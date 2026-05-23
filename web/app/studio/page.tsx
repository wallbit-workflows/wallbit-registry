import { SiteHeader } from "@/components/site-header";
import { WorkflowStudio } from "@/components/workflow-studio";

export const metadata = {
  title: "Workflow Studio — Wallbit Registry",
  description:
    "Generate wallbit-cli workflow YAML with AI using the wallbit-workflow-builder skill.",
};

export default function StudioPage() {
  return (
    <>
      <SiteHeader />
      <main className="studio-page h-[calc(100dvh-4rem)] overflow-hidden bg-cloud-canvas">
        <WorkflowStudio />
      </main>
    </>
  );
}
