export type StudioAttachment = {
  id: string;
  name: string;
  text: string;
};

const YAML_EXT = /\.ya?ml$/i;

export function isAllowedStudioFile(file: File): boolean {
  return YAML_EXT.test(file.name);
}

export async function fileToAttachment(file: File): Promise<StudioAttachment> {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    text: await file.text(),
  };
}

export function buildPromptWithAttachments(
  prompt: string,
  attachments: StudioAttachment[],
): string {
  let text = prompt.trim();

  if (attachments.length > 0) {
    const blocks = attachments.map(
      (f) => `Attached workflow \`${f.name}\`:\n\`\`\`yaml\n${f.text}\n\`\`\``,
    );
    text = text ? `${blocks.join("\n\n")}\n\n${text}` : blocks.join("\n\n");
  }

  return text;
}
