export type FencedBlock =
  | { type: "text"; content: string }
  | { type: "code"; lang: string; content: string };

/** Split markdown-style ``` fences into text and code segments. */
export function parseFencedBlocks(text: string): FencedBlock[] {
  const segments: FencedBlock[] = [];
  const re = /```(\w*)\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "code",
      lang: match[1].toLowerCase() || "text",
      content: match[2].replace(/\n$/, ""),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  if (segments.length === 0 && text) {
    segments.push({ type: "text", content: text });
  }

  return segments;
}
