// Tanah ("land" in Malay): a parcel with survey contours and a marker pin.
export function Mark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="mark">
      <defs><clipPath id="tanah-clip"><rect x="4" y="4" width="56" height="56" rx="16" /></clipPath></defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="var(--brand)" />
      <g clipPath="url(#tanah-clip)" fill="none" stroke="var(--on-brand)" strokeLinecap="round" strokeWidth="3.2">
        <path d="M-2 46 C 12 40, 18 50, 30 42 S 52 30, 68 34" opacity=".95" />
        <path d="M-2 36 C 10 30, 20 38, 30 31 S 50 20, 68 24" opacity=".6" />
        <path d="M-2 26 C 10 20, 20 27, 30 21 S 48 10, 68 14" opacity=".3" />
      </g>
      <circle cx="43" cy="19" r="6.5" fill="var(--gold)" />
      <circle cx="43" cy="19" r="2.4" fill="var(--brand)" />
    </svg>
  );
}

export default function Logo({ size = 30, sub = 'SG' }) {
  return (
    <span className="logo">
      <Mark size={size} />
      <span className="wordmark">tanah{sub && <small>{sub}</small>}</span>
    </span>
  );
}
