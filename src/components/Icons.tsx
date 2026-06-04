import type { ReactNode } from 'react';

type IconProps = { size?: number };

function Svg({ size = 20, children }: IconProps & { children: ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export function IconMenu(props: IconProps) { return <Svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>; }
export function IconSearch(props: IconProps) { return <Svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>; }
export function IconBag(props: IconProps) { return <Svg {...props}><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></Svg>; }
export function IconHeart(props: IconProps) { return <Svg {...props}><path d="M20.2 6.4a5 5 0 0 0-7.1 0L12 7.5l-1.1-1.1a5 5 0 0 0-7.1 7.1L12 21l8.2-7.5a5 5 0 0 0 0-7.1Z" /></Svg>; }
export function IconUser(props: IconProps) { return <Svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>; }
export function IconHome(props: IconProps) { return <Svg {...props}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></Svg>; }
export function IconGrid(props: IconProps) { return <Svg {...props}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></Svg>; }
