/** The explorer's mark: a mixin, a function and a variable flowing into one symbol. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Theming engine explorer"
    >
      <defs>
        <linearGradient id="logo-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="logo-mixin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="logo-function" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <radialGradient id="logo-core" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="0.45" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#0b1220" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="14.25"
        fill="none"
        stroke="url(#logo-frame)"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <path
        d="M17 18 C 30 18, 32 30, 41 31"
        fill="none"
        stroke="url(#logo-mixin)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M17 46 C 30 46, 32 34, 41 33"
        fill="none"
        stroke="url(#logo-function)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M17 24 L 17 40"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="2.5 4"
      />
      <circle cx="17" cy="18" r="5" fill="#34d399" />
      <circle cx="17" cy="46" r="5" fill="#a78bfa" />
      <circle cx="46" cy="32" r="11" fill="#38bdf8" opacity="0.18" />
      <circle cx="46" cy="32" r="7.5" fill="url(#logo-core)" />
      <circle cx="43.5" cy="29.5" r="2" fill="#f0f9ff" opacity="0.85" />
    </svg>
  );
}
