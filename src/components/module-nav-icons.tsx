type IconProps = { className?: string };

export function IconFila({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="35" height="35" className={className} aria-hidden fill="none">
      <path
        d="M4 6h16M4 12h16M4 18h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDashboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="35" height="35" className={className} aria-hidden fill="none">
      <path
        d="M4 13h7V4H4v9zm9 7h7V4h-7v16zM4 20h7v-5H4v5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconAgenda({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="35" height="35" className={className} aria-hidden fill="none">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconUsuarios({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="35" height="35" className={className} aria-hidden fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 19c.8-3 2.8-4.5 5.5-4.5S13.7 16 14.5 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 14.5c2 .3 3.5 1.6 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconConfig({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="35" height="35" className={className} aria-hidden fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconConta({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="35" height="35" className={className} aria-hidden fill="none">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19.5c1.2-3.2 3.5-4.8 7-4.8s5.8 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
