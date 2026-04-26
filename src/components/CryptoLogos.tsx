// Inline crypto logos — no external dependencies.

export function BtcLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fill="#fff"
        d="M21.7 14.3c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1.1-.3v0L9.3 8.5l-.4 1.8s1.3.3 1.2.3c.7.2.8.6.8 1l-.8 3c0 .1.1.1.2.2-.1 0-.2 0-.3-.1l-1.1 4.1c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.6c.4.1.8.2 1.2.3l-.7 2.7 1.7.4.7-2.7c.5.1.9.3 1.4.4l-.7 2.7 1.7.4.7-2.7c2.9.6 5.1.3 6-2.3.7-2.1-.1-3.3-1.6-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.4c-.5 2.1-4.1 1-5.3.7l1-3.6c1.2.3 4.9.9 4.3 2.9zm.5-5.4c-.5 1.9-3.5.9-4.5.7l.9-3.3c1 .2 4.1.7 3.6 2.6z"
      />
    </svg>
  );
}

export function UsdtLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#fff"
        d="M17.9 17.4v0c-.1 0-.7.1-1.9.1-1 0-1.7-.1-2 0v0c-3.6-.2-6.2-.8-6.2-1.5s2.6-1.4 6.2-1.5V17c.3 0 1 .1 2 .1 1.2 0 1.8 0 1.9-.1v-2.5c3.6.2 6.2.8 6.2 1.5s-2.6 1.4-6.2 1.5zm0-3.2v-2.3h5.2V8.5H8.9v3.5h5.2v2.3c-4.2.2-7.4.9-7.4 1.9s3.2 1.7 7.4 1.9v7.4h3.8v-7.4c4.2-.2 7.4-.9 7.4-1.9s-3.2-1.7-7.4-1.9z"
      />
    </svg>
  );
}

export function OpulOrb({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="orb-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#9DB8FF" />
          <stop offset="50%" stopColor="#1A6BFF" />
          <stop offset="100%" stopColor="#0A1F66" />
        </radialGradient>
        <filter id="orb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <circle cx="20" cy="20" r="14" fill="url(#orb-grad)" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="#1A6BFF" strokeOpacity="0.6" strokeWidth="1" filter="url(#orb-glow)" />
      <ellipse cx="16" cy="15" rx="4" ry="2.5" fill="#fff" fillOpacity="0.35" />
    </svg>
  );
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-display text-xl font-bold tracking-tight">
        Opul<span className="text-gradient-blue">Chain</span>
      </span>
    </div>
  );
}
