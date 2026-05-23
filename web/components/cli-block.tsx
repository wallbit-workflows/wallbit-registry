type Corner = "tl" | "tr" | "bl" | "br";

type Props = {
  command: string;
  caption?: string;
  className?: string;
};

const cornerAnchor: Record<Corner, string> = {
  tl: "left-0 top-0",
  tr: "right-0 top-0",
  bl: "left-0 bottom-0",
  br: "right-0 bottom-0",
};

/** Full cross centered on the corner (Vercel-style: lines extend both ways). */
function PlusCorner({ corner }: { corner: Corner }) {
  return (
    <div
      className={`pointer-events-none absolute ${cornerAnchor[corner]} size-0`}
      aria-hidden
    >
      <span className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-silver-mist/55" />
      <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 bg-silver-mist/55" />
    </div>
  );
}

export function CLIBlock({ command, caption, className = "" }: Props) {
  const frame = (
    <div className="relative mx-auto w-fit max-w-full px-6 py-5 sm:px-7 sm:py-6">
      <PlusCorner corner="tl" />
      <PlusCorner corner="tr" />
      <PlusCorner corner="bl" />
      <PlusCorner corner="br" />

      <pre className="overflow-x-auto text-center font-mono text-[13px] leading-snug whitespace-nowrap text-ink-black [scrollbar-width:none] sm:text-[14px] [&::-webkit-scrollbar]:hidden">
        {command}
      </pre>
    </div>
  );

  if (!caption) {
    return <div className={className}>{frame}</div>;
  }

  return (
    <div
      className={`mx-auto w-full max-w-4xl text-left ${className}`.trim()}
    >
      <p className="mb-1 text-center text-sm text-stone-gray">{caption}</p>
      {frame}
    </div>
  );
}
