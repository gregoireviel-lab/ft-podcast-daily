/**
 * The Essential brand mark — a broadcast/soundwave glyph inside a rounded tile.
 * Pure SVG, currentColor-driven, reused in the header, the player and the
 * generated PWA/OG icons so the identity stays consistent everywhere.
 */
export function BrandGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* central pillar */}
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      {/* inner bars */}
      <rect x="7" y="8.5" width="2" height="7" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="15" y="8.5" width="2" height="7" rx="1" fill="currentColor" opacity="0.85" />
      {/* outer bars */}
      <rect x="3" y="10.5" width="2" height="3" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="19" y="10.5" width="2" height="3" rx="1" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
