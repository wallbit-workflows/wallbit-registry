"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[var(--radius-inputs)] !border !border-cloud-canvas !bg-white !text-ink-black !shadow-[var(--shadow-feature)] !font-sans",
          title: "!text-sm !font-medium",
          description: "!text-slate-gray",
          closeButton:
            "!border-cloud-canvas !bg-paper-white !text-stone-gray hover:!text-ink-black",
          success: "!text-ink-black",
        },
      }}
    />
  );
}
