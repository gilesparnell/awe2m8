import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <AdminUsersManager currentUserEmail={session.user?.email || ''} />;
}
