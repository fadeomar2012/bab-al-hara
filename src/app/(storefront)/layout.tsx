import { CartProvider } from '@/components/CartProvider';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="pageShell">{children}</main>
      <MobileBottomNav />
    </CartProvider>
  );
}
