"use client";

import { CopyCodeBlock } from "@/components/copy-code-block";

type Props = {
  content: string;
  filename: string;
  version: string;
};

export function WorkflowYamlPanel({ content, filename, version }: Props) {
  return (
    <section className="stack-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-subheading text-ink-black">Workflow YAML</h2>
          <p className="mt-1 text-sm text-slate-gray">
            Published version{" "}
            <span className="font-mono text-stone-gray">v{version}</span>
          </p>
        </div>
      </div>
      <CopyCodeBlock
        code={content}
        label={filename}
        downloadFilename={filename}
        variant="plain"
        scrollable
      />
    </section>
  );
}
