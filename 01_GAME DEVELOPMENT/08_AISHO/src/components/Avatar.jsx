import { useId } from "react";

function HairBack({ style, color }) {
  if (style === "long" || style === "wavy") {
    return (
      <path
        fill={color}
        d="M78 176c-18 8-34 54-28 132 4 58 16 112 30 112h26c-14-46-8-104 8-148 12-34 18-62 46-70 28 8 36 38 48 72 16 46 22 104 8 146h26c14 0 26-54 30-112 6-78-10-124-28-132-32-86-86-112-132-108-44 4-92 32-134 108z"
      />
    );
  }
  if (style === "tied") {
    return (
      <g fill={color}>
        <circle cx="160" cy="86" r="26" />
        <path d="M92 168c-10-48 16-92 68-96 54-4 86 40 78 96 18 20 16 48-2 70-22-8-34 6-48 8-16 2-28-10-36-8-20 6-36-4-52-10-16-16-18-42-8-60z" />
      </g>
    );
  }
  if (style === "bob") {
    return (
      <path
        fill={color}
        d="M76 188c-6-62 24-112 84-116 62-4 96 46 90 112 10 34-2 70-24 90-18 8-34 0-40-14-2-16 2-28-14-30-24 6-42 2-52-12-16-8-34-30-44-30z"
      />
    );
  }
  if (style === "messy") {
    return (
      <path
        fill={color}
        d="M96 156c-8-36 8-78 40-92 10-28 28-20 36-8 16-20 40-16 52 0 28 8 48 48 42 96 12 10 8 28-8 36-16-20-28-6-44 0-12 6-24 4-34-4-18-10-28-6-40 2-18-4-36-16-44-30z"
      />
    );
  }
  return (
    <path
      fill={color}
      d="M98 150c-8-42 18-84 62-88 46-4 74 36 70 84 12 16 8 34-6 44-16-14-30-6-42 4-10 8-22 8-32-2-16-10-30-16-40-6-12-8-20-24-12-36z"
    />
  );
}

function HairFront({ style, color }) {
  if (style === "bob" || style === "long" || style === "wavy" || style === "tied") {
    return (
      <path
        fill={color}
        d="M90 156c8-52 40-78 70-74 32 2 62 28 72 74-22-28-36-16-52-18-8 16-18 22-28 10-12 14-24 12-34-8-14 0-24-8-28-14-8 8-16 14-28 16-10-10-16-28-12-46z"
      />
    );
  }
  if (style === "messy") {
    return (
      <path
        fill={color}
        d="M102 148c6-40 28-62 52-66 8-16 24-12 30-2 14-10 32-6 40 8 8 28 4 48-8 58-16-16-24-4-36 2-10 4-18 2-26-6-12-6-20-4-28 4-14-8-24-22-24-42z"
      />
    );
  }
  return (
    <path
      fill={color}
      d="M104 146c10-46 36-66 58-64 28 2 52 24 60 62-18-24-34-14-48-16-6 14-20 16-28 4-10 12-22 10-32-6-12 2-20-6-22-16-6 6-12 12-16 16-8-8-12-24-8-40z"
    />
  );
}

function Glasses() {
  return (
    <g fill="none" stroke="#242424" strokeWidth="3.5">
      <circle cx="132" cy="188" r="18" />
      <circle cx="190" cy="188" r="18" />
      <path d="M150 188h22" strokeLinecap="round" />
      <path d="M114 186h-14M208 186h14" strokeLinecap="round" />
    </g>
  );
}

export function Avatar({ person, className }) {
  const look = person.look;
  const fem = person.gender === "female";
  const grin = person.id === "minato" || person.id === "hinata";
  const stamp = useId().replace(/:/g, "");
  const clip = `${person.id}-${stamp}-clip`;
  const bg = `${person.id}-${stamp}-bg`;
  const showEars = !["long", "wavy", "bob"].includes(look.hairStyle);

  return (
    <svg className={className} viewBox="0 0 320 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label={person.name}>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={look.bg1} />
          <stop offset="100%" stopColor={look.bg2} />
        </linearGradient>
        <clipPath id={clip}>
          <rect width="320" height="420" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="320" height="420" fill={`url(#${bg})`} />
        <circle cx="250" cy="64" r="78" fill="#fff" opacity="0.28" />
        <circle cx="64" cy="300" r="90" fill="#fff" opacity="0.14" />
        <HairBack style={look.hairStyle} color={look.hair} />
        <path d="M146 248h28c2 28-4 48-14 58-10-10-16-30-14-58z" fill={look.skin} />
        <path d="M78 420V338c26-44 52-62 82-62s56 18 82 62v82H78z" fill={look.cloth} />
        {showEars && (
          <>
            <ellipse cx="92" cy="202" rx="12" ry="16" fill={look.skin} />
            <ellipse cx="228" cy="202" rx="12" ry="16" fill={look.skin} />
          </>
        )}
        <ellipse cx="160" cy="196" rx={fem ? 68 : 74} ry={fem ? 82 : 76} fill={look.skin} />
        <ellipse cx="116" cy="214" rx="14" ry="8" fill={look.blush} opacity="0.45" />
        <ellipse cx="206" cy="214" rx="14" ry="8" fill={look.blush} opacity="0.45" />
        <path
          d={fem ? "M112 168c14-10 30-8 40 0" : "M114 170c14-6 28-4 36 2"}
          fill="none"
          stroke={look.hair}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d={fem ? "M170 168c12-10 30-10 40 0" : "M172 172c12-6 28-4 38 2"}
          fill="none"
          stroke={look.hair}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <ellipse cx="132" cy="188" rx="7.5" ry="8.5" fill="#fff" />
        <ellipse cx="190" cy="188" rx="7.5" ry="8.5" fill="#fff" />
        <ellipse cx="133" cy="189" rx="3.6" ry="4.2" fill={look.eye} />
        <ellipse cx="191" cy="189" rx="3.6" ry="4.2" fill={look.eye} />
        <circle cx="134.5" cy="188" r="1.1" fill="#fff" />
        <circle cx="192.5" cy="188" r="1.1" fill="#fff" />
        <path d="M158 200c6 10 4 18 2 24" fill="none" stroke={look.hair} strokeWidth="2.2" opacity="0.35" strokeLinecap="round" />
        <path
          d={grin ? "M138 230c14 16 32 16 46 0" : fem ? "M144 232c10 12 24 12 34 0" : "M146 234c10 8 22 8 30 0"}
          fill="none"
          stroke={look.lip}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <HairFront style={look.hairStyle} color={look.hair} />
        {look.glasses && <Glasses />}
        {person.id === "minato" && <circle cx="228" cy="208" r="4" fill="#d7d7d7" stroke="#242424" strokeWidth="2" />}
      </g>
    </svg>
  );
}

export function Monogram({ name }) {
  const letter = [...(name || "?")][0] || "?";
  return (
    <div className="mono" aria-hidden="true">
      {letter}
    </div>
  );
}
