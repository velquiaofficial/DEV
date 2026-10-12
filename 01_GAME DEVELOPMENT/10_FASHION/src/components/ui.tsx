import { useState } from "react";

export function Photo({
  src,
  alt,
  tone,
  className,
}: {
  src: string;
  alt: string;
  tone: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={className ? `${className} photo-fallback` : "photo-fallback"}
        style={{ background: `linear-gradient(165deg, ${tone} 0%, #2a211e 78%)` }}
        role="img"
        aria-label={alt}
      />
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="7" r="2" fill="currentColor" />
      <circle cx="15" cy="12" r="2" fill="currentColor" />
      <circle cx="10" cy="17" r="2" fill="currentColor" />
    </svg>
  );
}

export function IconCards() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="3" width="12" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 7.5v12A1.5 1.5 0 0 0 6.5 21H16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5 13.8 8.2 19.5 10 13.8 11.8 12 17.5 10.2 11.8 4.5 10 10.2 8.2 12 2.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M18 14.5 18.7 16.8 19.8 17.5 18.7 18.2 18 20.5 17.3 18.2 16.2 17.5 17.3 16.8 18 14.5Z" fill="currentColor" />
    </svg>
  );
}

export function IconHeart({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.2s-6.7-4.1-8.8-8C1.6 9.4 2.6 6.2 5.7 6c1.8-.1 3 .9 3.8 2.2C10.4 6.9 11.6 5.9 13.4 6c3.1.2 4.1 3.4 2.5 6.2-2.1 3.9-3.9 8-3.9 8Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconStar() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="m12 3.5 2.2 5.3 5.8.5-4.4 3.7 1.4 5.6L12 15.8 7 18.6l1.4-5.6L4 9.3l5.8-.5L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUndo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M8 8H4V4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 9A8 8 0 1 1 6 16.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BudgetField({
  budget,
  onChange,
  compact = false,
}: {
  budget: number;
  onChange: (budget: number) => void;
  compact?: boolean;
}) {
  return (
    <label className={compact ? "budget-field compact" : "budget-field"}>
      <em>¥</em>
      <input
        inputMode="numeric"
        aria-label="予算"
        placeholder="20000"
        value={budget > 0 ? new Intl.NumberFormat("ja-JP").format(budget) : ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, "").slice(0, 6);
          onChange(digits ? Number(digits) : 0);
        }}
      />
    </label>
  );
}
