import type { Metadata, Viewport } from 'next';
import { Tajawal, El_Messiri } from 'next/font/google';
import { brand } from '@/lib/brand';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-brand',
  display: 'swap'
});

const elMessiri = El_Messiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap'
});

export const metadata: Metadata = {
  title: brand.title,
  description: brand.description,
  icons: {
    icon: '/brand/saad-center/png/favicon-32.png',
    apple: '/brand/saad-center/png/favicon-180.png',
  },
};

export const viewport: Viewport = {
  themeColor: brand.colors.burgundy,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${elMessiri.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
