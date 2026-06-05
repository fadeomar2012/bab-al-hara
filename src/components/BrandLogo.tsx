import type { CSSProperties } from 'react';

/**
 * Variants:
 *  - `full`     large lockup (mark + Arabic name + English subtitle) — footer, login
 *  - `header`   compact lockup for the storefront header (subtitle hides < 400px)
 *  - `sidebar` / `admin`   medium lockup for the admin sidebar/drawer
 *  - `compact`  mark-in-tile only (no text) — tight mobile / icon slots
 *  - `mark`     bare glyph, no tile (inherits color/size from context)
 *  - `print`    high-contrast black/white lockup for invoices & packing slips
 */
type BrandLogoVariant = 'full' | 'header' | 'sidebar' | 'admin' | 'compact' | 'mark' | 'print';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  /** Override the Arabic name (defaults to "باب الحارة"). */
  name?: string;
  /** English subtitle; pass null to hide. */
  subtitle?: string | null;
  className?: string;
  style?: CSSProperties;
};

/**
 * BrandMark — the boutique-doorway monogram. "باب الحارة" means "the neighborhood
 * gate", so the mark is a storefront archway: a solid arch frame (currentColor)
 * with an open doorway carved out (even-odd), plus a gold seam + handle that read
 * as an elegant double door. Single color + one accent var → adapts to light,
 * dark, and print contexts and stays crisp down to favicon sizes.
 */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Arch frame with the doorway opening cut out (even-odd) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M10 41V22.5C10 14.49 16.27 8 24 8s14 6.49 14 14.5V41a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V23.2C31 18.4 27.87 14.6 24 14.6S17 18.4 17 23.2V41a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1Z"
      />
      {/* Door seam + handle (accent) */}
      <line
        x1="24" y1="15.4" x2="24" y2="42"
        stroke="var(--brand-logo-accent, var(--gold, #c9a65a))"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="20.4" cy="31" r="1.45" fill="var(--brand-logo-accent, var(--gold, #c9a65a))" />
      {/* Keystone dot above the doorway (accent) */}
      <circle cx="24" cy="11.4" r="1.5" fill="var(--brand-logo-accent, var(--gold, #c9a65a))" />
    </svg>
  );
}

const DEFAULT_NAME = 'باب الحارة';
const DEFAULT_SUBTITLE = 'Bab Al Hara Boutique';

// Normalize aliases and resolve per-variant rendering.
function resolveVariant(variant: BrandLogoVariant) {
  switch (variant) {
    case 'full':
      return { cls: 'full', markSize: 38, showText: true };
    case 'sidebar':
    case 'admin':
      return { cls: 'sidebar', markSize: 26, showText: true };
    case 'compact':
      return { cls: 'compact', markSize: 27, showText: false };
    case 'print':
      return { cls: 'print', markSize: 32, showText: true };
    case 'header':
    default:
      return { cls: 'header', markSize: 29, showText: true };
  }
}

export function BrandLogo({
  variant = 'header',
  name = DEFAULT_NAME,
  subtitle = DEFAULT_SUBTITLE,
  className,
  style
}: BrandLogoProps) {
  if (variant === 'mark') {
    return (
      <span className={`brandLogoMark ${className ?? ''}`.trim()} style={style} aria-hidden="true">
        <BrandMark size={28} />
      </span>
    );
  }

  const { cls, markSize, showText } = resolveVariant(variant);

  return (
    <span className={`brandLogo brandLogo--${cls} ${className ?? ''}`.trim()} style={style}>
      <span className="brandLogoMark">
        <BrandMark size={markSize} />
      </span>
      {showText ? (
        <span className="brandLogoText">
          <strong>{name}</strong>
          {subtitle ? <span className="brandLogoSub">{subtitle}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
