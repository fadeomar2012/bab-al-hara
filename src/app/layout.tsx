import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bab Al Hara Storefront',
  description: 'Mobile-first boutique marketplace storefront for Bab Al Hara.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
