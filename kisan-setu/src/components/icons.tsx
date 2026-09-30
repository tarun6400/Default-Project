export function WheatSprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M24 44V14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      {/* left grains */}
      <ellipse cx="18" cy="30" rx="5.5" ry="2.6" fill="currentColor" transform="rotate(-30 18 30)" />
      <ellipse cx="17" cy="25" rx="5.5" ry="2.6" fill="currentColor" opacity="0.85" transform="rotate(-30 17 25)" />
      <ellipse cx="17.5" cy="20" rx="5" ry="2.4" fill="currentColor" opacity="0.7" transform="rotate(-30 17.5 20)" />
      {/* right grains */}
      <ellipse cx="30" cy="31" rx="5.5" ry="2.6" fill="currentColor" transform="rotate(30 30 31)" />
      <ellipse cx="31" cy="26" rx="5.5" ry="2.6" fill="currentColor" opacity="0.85" transform="rotate(30 31 26)" />
      <ellipse cx="30.5" cy="21" rx="5" ry="2.4" fill="currentColor" opacity="0.7" transform="rotate(30 30.5 21)" />
      {/* top spike */}
      <path d="M24 14c0-3 2.5-5.5 6-6.5-1 3.5-3 5.5-6 6.5Z" fill="currentColor" />
    </svg>
  );
}

export function SproutMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M24 42V22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 26c0-9 5-15 13-17-1 9.5-6 15-13 17Z" fill="currentColor" />
      <path d="M24 34c0-8-4.5-13-12-15 1 8.5 5.5 13 12 15Z" fill="currentColor" opacity="0.8" />
      <path d="M24 22c0-6 3-9.5 8-11-1 6-3.5 9-8 11Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function GrainBag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M14 14c0-3 2.5-5 5-5h10c2.5 0 5 2 5 5v26a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V14Z" fill="currentColor" opacity="0.9" />
      <path d="M14 14h20" stroke="var(--cream-50)" strokeWidth="1.4" opacity="0.6" />
      <path d="M17 10l2.5-3M24 9l1-3M31 10l-2.5-3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 22c2.5 2 5.5 2 8 0M20 27c2.5 2 5.5 2 8 0M20 32c2.5 2 5.5 2 8 0" stroke="var(--cream-50)" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Tractor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M8 30c0-1 .8-2 2-2h16v8H10a2 2 0 0 1-2-2v-4Z" fill="currentColor" opacity="0.9" />
      <path d="M10 36a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M34 30h4l4 5v2c0 1-.8 2-2 2h-6v-9Z" fill="currentColor" opacity="0.75" />
      <circle cx="36" cy="38" r="3.4" stroke="currentColor" strokeWidth="2.2" />
      <path d="M24 18h8l2 8H24v-8Z" fill="currentColor" opacity="0.6" />
      <path d="M24 26h10" stroke="currentColor" strokeWidth="2" />
      <path d="M4 30c0-4 3-6 8-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function SunFields({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 90" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="sf-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold-500)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--gold-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M200 6c-24 0-26 14-54 14S110 6 86 8s-26 12-52 10-30-6-34-2" stroke="var(--gold-600)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      {[30, 70, 110, 150, 190, 230, 270, 310, 350].map((x, i) => (
        <path key={x} d={`M${x} 60 l${i % 2 ? 6 : 10} 14 M${x} 60 l${i % 2 ? -6 : -10} 14`} stroke="var(--grain-500)" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      ))}
      <ellipse cx="300" cy="20" rx="90" ry="34" fill="url(#sf-g)" />
    </svg>
  );
}

export function MandiIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M8 42V16L24 6l16 10v26" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M17 42V28h14v14" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M20 14l4-2.5L28 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function FieldRows({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="fr-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--grain-700)" />
          <stop offset="1" stopColor="var(--grain-500)" />
        </linearGradient>
      </defs>
      {[18, 44, 70, 96, 122].map((y, i) => (
        <path key={y} d={`M0 ${y} Q 40 ${y - 10} 80 ${y} T 160 ${y} T 240 ${y} T 320 ${y} T 400 ${y}`} stroke={i % 2 ? "var(--grain-400)" : "var(--grain-300)"} strokeWidth="3" fill="none" opacity="0.9" />
      ))}
      {[6, 30, 56, 82, 108, 132].map((x, i) => (
        <path key={`m${x}`} d={`M${x} 0v140`} stroke="var(--gold-400)" strokeWidth="1.2" opacity="0.18" transform={`rotate(${i % 2 ? -8 : 8} ${x} 70)`} />
      ))}
      <path d="M0 138 Q 100 128 200 134 T 400 132 V140 H0Z" fill="url(#fr-g)" opacity="0.35" />
    </svg>
  );
}