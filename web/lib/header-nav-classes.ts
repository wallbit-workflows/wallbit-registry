/** Shared header nav control styles (36px height). */

const headerNavBase =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full text-sm font-medium whitespace-nowrap transition-colors";

export const headerNavText = `${headerNavBase} px-3 text-black/56 hover:bg-white/55 hover:text-ink-black`;

export const headerNavTextButton = `${headerNavText} cursor-pointer border-0 bg-transparent`;

export const headerNavCta = `${headerNavBase} bg-fire-orange px-3.5 text-white transition-[filter] hover:brightness-105`;

export const headerNavCtaButton = `${headerNavCta} cursor-pointer border-0`;
