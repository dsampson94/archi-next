'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineCurrencyDollar,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineDocumentReport,
  HiOutlineBell,
  HiOutlineSupport,
} from 'react-icons/hi';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HiOutlineHome },
  { name: 'Tenants', href: '/admin/tenants', icon: HiOutlineOfficeBuilding },
  { name: 'Users', href: '/admin/users', icon: HiOutlineUserGroup },
  { name: 'Billing', href: '/admin/billing', icon: HiOutlineCurrencyDollar },
  { name: 'Analytics', href: '/admin/analytics', icon: HiOutlineChartBar },
  { name: 'Reports', href: '/admin/reports', icon: HiOutlineDocumentReport },
  { name: 'Notifications', href: '/admin/notifications', icon: HiOutlineBell },
  { name: 'Support Tickets', href: '/admin/support', icon: HiOutlineSupport },
  { name: 'Settings', href: '/admin/settings', icon: HiOutlineCog },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/validate', { credentials: 'include' });
        if (!res.ok) {
          router.push('/auth');
          return;
        }
        const data = await res.json();
        // Only allow OWNER role to access admin
        if (data.user.role !== 'OWNER') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
      } catch (error) {
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <HiOutlineShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Badge */}
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <HiOutlineShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Super Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Back to Dashboard */}
          <div className="px-3 py-2 border-t border-slate-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <HiOutlineHome className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 font-medium">
                  {user.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white ml-2 lg:ml-0">
              {navigation.find((n) => isActive(n.href))?.name || 'Admin'}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full font-medium">
                Platform Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
