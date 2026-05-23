"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageContent } from "@/components/chat-message-content";
import { StudioChatComposer } from "@/components/studio-chat-composer";
import { StudioHero } from "@/components/studio-hero";
import type { StudioAttachment } from "@/lib/studio-attachments";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: string[];
};

export function WorkflowStudio() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<StudioAttachment[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftAssistant, setDraftAssistant] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const inConversation = messages.length > 0;

  const send = useCallback(
    async (text?: string, files: StudioAttachment[] = attachments) => {
      const prompt = (text ?? input).trim();
      if ((!prompt && files.length === 0) || streaming) return;

      setError(null);
      setDraftAssistant("");
      setStreaming(true);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        attachments:
          files.length > 0 ? files.map((f) => f.name) : undefined,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setAttachments([]);

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      let accumulated = "";

      try {
        const res = await fetch("/api/workflow-studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            attachments: files,
            agentId,
          }),
          signal: ac.signal,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        if (!res.body) {
          throw new Error("No response stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const lines = part.split("\n");
            let event = "message";
            let data = "";

            for (const line of lines) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              if (line.startsWith("data:")) data = line.slice(5).trim();
            }

            if (!data) continue;
            const payload = JSON.parse(data) as Record<string, unknown>;

            if (event === "agent" && typeof payload.agentId === "string") {
              setAgentId(payload.agentId);
            }
            if (event === "text" && typeof payload.delta === "string") {
              accumulated += payload.delta;
              setDraftAssistant(accumulated);
            }
            if (event === "error") {
              throw new Error(
                typeof payload.message === "string"
                  ? payload.message
                  : "Generation failed",
              );
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: accumulated,
          },
        ]);
        setDraftAssistant("");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [agentId, streaming, input, attachments],
  );

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setAgentId(null);
    setDraftAssistant("");
    setError(null);
    setInput("");
    setAttachments([]);
  };

  useEffect(() => {
    if (!inConversation) return;
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draftAssistant, streaming, inConversation]);

  const composer = (
    <StudioChatComposer
      input={input}
      onInputChange={setInput}
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      onSend={() => send()}
      onReset={reset}
      streaming={streaming}
      showStarters={!inConversation && !streaming}
      onStarterSelect={(prompt) => send(prompt, [])}
      canReset={inConversation || agentId !== null}
    />
  );

  if (inConversation) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-cloud-canvas">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="page-wrap mx-auto max-w-3xl pb-44 pt-6">
            <div className="stack-md min-w-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === "user"
                      ? "ml-8 rounded-2xl bg-paper-white px-4 py-3 shadow-[var(--shadow-feature)]"
                      : "mr-4 stack-sm"
                  }
                >
                  <p className="text-caption text-slate-gray">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </p>
                  <ChatMessageContent
                    content={msg.content}
                    role={msg.role}
                    attachments={msg.attachments}
                  />
                </div>
              ))}

              {streaming && draftAssistant && (
                <div className="mr-4 stack-sm">
                  <p className="text-caption text-slate-gray">Assistant</p>
                  <ChatMessageContent
                    content={draftAssistant}
                    role="assistant"
                    streaming
                  />
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-pale-sienna bg-paper-white px-4 py-3 text-sm text-ink-black">
                  {error}
                </p>
              )}

              <div ref={scrollEndRef} className="h-px" aria-hidden />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-cloud-canvas/80 bg-cloud-canvas/90 backdrop-blur-md">
          <div className="page-wrap mx-auto max-w-3xl py-4">{composer}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain">
      <StudioHero />
      <div className="page-wrap mx-auto max-w-3xl pb-24 pt-6">
        {error && (
          <p className="mb-6 rounded-lg border border-pale-sienna bg-paper-white px-4 py-3 text-sm text-ink-black">
            {error}
          </p>
        )}
        {composer}
      </div>
    </div>
  );
}
