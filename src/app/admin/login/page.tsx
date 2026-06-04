import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/features/admin/auth/admin-auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Login · Bab Al Hara'
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect('/admin');

  return (
    <div className="adminRoot" dir="ltr">
      <div className="adminLoginShell">
        <div className="adminLoginCard">
          <div className="adminBrandMark">باب<br />الحارة</div>
          <h1>Catalog Admin</h1>
          <p className="adminMuted">Sign in to manage the Bab Al Hara catalog.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
