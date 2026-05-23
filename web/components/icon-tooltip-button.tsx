"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip: string;
  /** When true, the hover label is hidden (e.g. after click feedback). */
  hideTooltip?: boolean;
  children: ReactNode;
};

/** Icon action with a short label on hover (ChatGPT-style). */
export function IconTooltipButton({
  tooltip,
  hideTooltip = false,
  children,
  className = "",
  type = "button",
  "aria-label": ariaLabel,
  onClick,
  ...props
}: Props) {
  return (
    <div className="relative flex">
      <button
        type={type}
        className={`peer/icon-btn inline-flex size-8 items-center justify-center rounded-md text-code-blue transition hover:bg-cloud-canvas ${className}`.trim()}
        aria-label={ariaLabel ?? tooltip}
        onClick={(e) => {
          onClick?.(e);
          e.currentTarget.blur();
        }}
        {...props}
      >
        {children}
      </button>
      {!hideTooltip && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-black px-2 py-1 text-[11px] font-medium leading-none text-white opacity-0 shadow-md transition-opacity duration-150 peer-hover/icon-btn:opacity-100"
        >
          {tooltip}
        </span>
      )}
    </div>
  );
}
