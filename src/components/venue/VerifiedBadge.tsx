/** Gradient check shown next to approved venue names. */
export const VerifiedBadge = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={`inline-block shrink-0 align-[-2px] ${className}`}
    role="img"
    aria-label="Verifiziert"
  >
    <defs>
      <linearGradient id="feyrn-verified" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="11" fill="url(#feyrn-verified)" />
    <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
