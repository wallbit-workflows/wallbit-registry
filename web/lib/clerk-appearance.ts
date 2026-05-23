import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  elements: {
    rootBox: "font-sans",
    card: "shadow-[var(--shadow-feature)] rounded-[var(--radius-cards)]",
    headerTitle: "text-ink-black",
    headerSubtitle: "text-slate-gray",
    socialButtonsBlockButton:
      "border-cloud-canvas text-ink-black hover:bg-paper-white",
    formFieldLabel: "text-stone-gray",
    formFieldInput:
      "border-cloud-canvas rounded-[var(--radius-inputs)] focus:border-frost-gray",
    formButtonPrimary:
      "bg-fire-orange hover:bg-fire-orange/90 text-white shadow-none",
    footerActionLink: "text-fire-orange hover:text-fire-orange",
    identityPreviewText: "text-ink-black",
    identityPreviewEditButton: "text-code-blue",
  },
};
