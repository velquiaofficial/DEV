import type { ReactNode } from "react";

export function TopBar({
  title,
  onBack,
  backLabel = "戻る",
  muted,
  onToggleMute,
}: {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="icon-btn" onClick={onBack}>
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      <span className="topbar-title">{title}</span>
      <button type="button" className="icon-btn" onClick={onToggleMute} aria-pressed={muted}>
        {muted ? "音オフ" : "音オン"}
      </button>
    </header>
  );
}

export function Section({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="section">
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Stepper({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${label}を減らす`}>
        −
      </button>
      <strong>{value}</strong>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${label}を増やす`}>
        ＋
      </button>
    </div>
  );
}

export function Switch({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" className={checked ? "switch on" : "switch"} aria-pressed={checked} onClick={() => onChange(!checked)}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <i />
    </button>
  );
}
