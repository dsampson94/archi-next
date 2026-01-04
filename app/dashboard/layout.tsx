import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your Archi knowledge base and conversations',
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as {
      userId: string;
      email: string;
      name: string;
      role: string;
      tenantId?: string;
      tenantName?: string;
    };
  } catch {
    return null;
  }
}

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/auth');
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
