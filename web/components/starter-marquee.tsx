"use client";

import styles from "./starter-marquee.module.css";

const STARTERS = [
  "Checking balance snapshot across USD and EUR accounts",
  "FX rate USD→EUR, then fetch account details for the source currency",
  "Safe read-only smoke test: rates, balances, wallets, and cards list",
  "Paginated asset catalog (first page) and details for one ticker",
  "List transactions in EUR using the rate from a prior FX step",
] as const;

type Props = {
  onSelect: (prompt: string) => void;
};

function StarterPill({
  text,
  onSelect,
}: {
  text: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="shrink-0 rounded-2xl border border-cloud-canvas bg-paper-white px-4 py-2.5 text-left text-sm leading-snug whitespace-nowrap text-stone-gray transition hover:border-frost-gray hover:text-ink-black"
    >
      {text}
    </button>
  );
}

export function StarterMarquee({ onSelect }: Props) {
  const loop = [...STARTERS, ...STARTERS];

  return (
    <div className={styles.root}>
      <div className={styles.track}>
        {loop.map((starter, i) => (
          <StarterPill
            key={`${starter}-${i}`}
            text={starter}
            onSelect={() => onSelect(starter)}
          />
        ))}
      </div>
    </div>
  );
}
