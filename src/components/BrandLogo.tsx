import type { CSSProperties } from 'react';
import { brand } from '@/lib/brand';

/**
 * Variants:
 *  - `full`     large lockup — footer, login
 *  - `header`   horizontal lockup for the storefront header
 *  - `sidebar` / `admin`   lockup for the admin sidebar/drawer
 *  - `compact`  badge icon only — tight mobile / icon slots
 *  - `mark`     bare icon, no container (inherits size from context)
 *  - `print`    mono burgundy lockup for invoices & packing slips
 */
type BrandLogoVariant = 'full' | 'header' | 'sidebar' | 'admin' | 'compact' | 'mark' | 'print';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  /** Accepted but unused — name is baked into the SVG assets. Kept for API compat. */
  name?: string;
  /** Subtitle shown below the logo mark in sidebar / print contexts. Pass null to hide. */
  subtitle?: string | null;
  className?: string;
  style?: CSSProperties;
};

const ALT = 'سعد سنتر — Saad Center';

/** Kept for backward compatibility — used directly by print templates. */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <img
      src={brand.logo.monoBurgundy}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

export function BrandLogo({
  variant = 'header',
  subtitle,
  className,
  style
}: Omit<BrandLogoProps, 'name'> & { name?: string }) {
  if (variant === 'mark') {
    return (
      <span className={`brandLogoMark ${className ?? ''}`.trim()} style={style} aria-hidden="true">
        <img
          src={brand.logo.icon}
          width={28}
          height={28}
          alt=""
          aria-hidden="true"
          style={{ objectFit: 'contain', display: 'block' }}
        />
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={`brandLogo brandLogo--compact ${className ?? ''}`.trim()} style={style}>
        <img
          src={brand.logo.iconBadge}
          width={27}
          height={27}
          alt={ALT}
          style={{ objectFit: 'contain', display: 'block' }}
        />
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <span className={`brandLogo brandLogo--full ${className ?? ''}`.trim()} style={style}>
        <img
          src={brand.logo.full}
          height={96}
          alt={ALT}
          style={{ objectFit: 'contain', maxWidth: '100%', display: 'block' }}
        />
      </span>
    );
  }

  if (variant === 'print') {
    return (
      <span className={`brandLogo brandLogo--print ${className ?? ''}`.trim()} style={style}>
        <img
          src={brand.logo.monoBurgundy}
          height={32}
          alt={ALT}
          style={{ objectFit: 'contain', display: 'block' }}
        />
        {subtitle !== null ? (
          <span className="brandLogoText">
            <strong>{brand.name}</strong>
            <span className="brandLogoSub">{subtitle ?? brand.tagline}</span>
          </span>
        ) : null}
      </span>
    );
  }

  // header, sidebar, admin
  const isSidebar = variant === 'sidebar' || variant === 'admin';
  const cls = isSidebar ? 'sidebar' : 'header';
  const h = isSidebar ? 30 : 34;

  return (
    <span className={`brandLogo brandLogo--${cls} ${className ?? ''}`.trim()} style={style}>
      <img
        src={brand.logo.header}
        height={h}
        alt={ALT}
        style={{ objectFit: 'contain', display: 'block' }}
      />
      {subtitle !== undefined && subtitle !== null ? (
        <span className="brandLogoSub">{subtitle}</span>
      ) : null}
    </span>
  );
}
