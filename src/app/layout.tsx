import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-brand',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Bab Al Hara Storefront',
  description: 'Mobile-first boutique marketplace storefront for Bab Al Hara.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
