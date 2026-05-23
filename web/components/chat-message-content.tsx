"use client";

import { CopyCodeBlock } from "@/components/copy-code-block";
import { WorkflowAttachmentChip } from "@/components/workflow-attachment-chip";
import { parseFencedBlocks } from "@/lib/parse-fenced-blocks";
import { filenameFromYaml } from "@/lib/workflow-filename";

type Props = {
  content: string;
  role: "user" | "assistant";
  attachments?: string[];
  streaming?: boolean;
};

/** Legacy user messages: "Attached: a.yaml, b.yaml" */
const ATTACHED_LINE_RE = /^Attached:\s*(.+)$/m;

function parseLegacyAttachments(text: string): {
  body: string;
  files: string[];
} {
  const match = text.match(ATTACHED_LINE_RE);
  if (!match) return { body: text, files: [] };

  const files = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const body = text.replace(ATTACHED_LINE_RE, "").trim();
  return { body, files };
}

const WALLBIT_CMD_RE = /`?(wallbit workflow (?:validate|run) [\w.-]+\.yaml)`?/gi;

function InlineCommand({ command }: { command: string }) {
  return (
    <code className="rounded bg-paper-white px-1.5 py-0.5 font-mono text-[13px] text-ink-black">
      {command}
    </code>
  );
}

function renderTextWithInlineCommands(text: string, key: string) {
  const parts: Array<{ type: "text"; content: string } | { type: "cli"; command: string }> =
    [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(WALLBIT_CMD_RE.source, "gi");

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "cli", command: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    return (
      <p key={key} className="whitespace-pre-wrap leading-relaxed">
        {trimmed}
      </p>
    );
  }

  return (
    <p key={key} className="leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === "cli") {
          return <InlineCommand key={`${key}-c-${i}`} command={part.command} />;
        }
        return <span key={`${key}-t-${i}`}>{part.content}</span>;
      })}
    </p>
  );
}

function isYamlLang(lang: string): boolean {
  return lang === "yaml" || lang === "yml";
}

function isWallbitCommand(code: string): boolean {
  return /^wallbit workflow (?:validate|run) /i.test(code.trim());
}

export function ChatMessageContent({
  content,
  role,
  attachments,
  streaming,
}: Props) {
  if (role === "user") {
    const legacy = parseLegacyAttachments(content);
    const body = attachments?.length ? content.trim() : legacy.body;
    const files = attachments?.length ? attachments : legacy.files;

    return (
      <div className="stack-sm min-w-0 text-sm text-ink-black">
        {body ? (
          <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        ) : null}
        {files.length > 0 && (
          <ul
            className="flex flex-wrap gap-1.5"
            aria-label="Attached workflows"
          >
            {files.map((name) => (
              <li key={name} className="min-w-0">
                <WorkflowAttachmentChip name={name} variant="message" />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const segments = parseFencedBlocks(content);

  return (
    <div className="stack-md min-w-0 text-sm text-ink-black">
      {segments.map((segment, i) => {
        if (segment.type === "text") {
          return renderTextWithInlineCommands(segment.content, `text-${i}`);
        }

        if (isYamlLang(segment.lang)) {
          const filename = filenameFromYaml(segment.content);
          return (
            <CopyCodeBlock
              key={`code-${i}`}
              code={segment.content}
              label={filename}
              variant="chat"
              downloadFilename={filename}
              publishable
            />
          );
        }

        if (isWallbitCommand(segment.content)) {
          return (
            <p key={`code-${i}`} className="leading-relaxed">
              <InlineCommand command={segment.content.trim()} />
            </p>
          );
        }

        return (
          <CopyCodeBlock
            key={`code-${i}`}
            code={segment.content}
            label={segment.lang || "code"}
            variant="chat"
          />
        );
      })}
      {streaming && (
        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-fire-orange align-middle" />
      )}
    </div>
  );
}
