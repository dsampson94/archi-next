'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineChat,
  HiOutlineCog,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlinePhone,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { Coins, Plus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import TokenPurchaseModal from './TokenPurchaseModal';

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  tenantName?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HiOutlineHome },
  { name: 'Documents', href: '/dashboard/documents', icon: HiOutlineDocumentText },
  { name: 'Conversations', href: '/dashboard/conversations', icon: HiOutlineChat },
  { name: 'Bots', href: '/dashboard/agents', icon: HiOutlineLightningBolt },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: FaWhatsapp },
  { name: 'Analytics', href: '/dashboard/analytics', icon: HiOutlineChartBar },
  { name: 'Billing', href: '/dashboard/billing', icon: Coins },
  { name: 'Team', href: '/dashboard/team', icon: HiOutlineUserGroup },
  { name: 'Settings', href: '/dashboard/settings', icon: HiOutlineCog },
];

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/billing/balance');
      const data = await res.json();
      if (data.balance !== undefined) {
        setTokenBalance(data.balance);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

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
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-archi-400 to-archi-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-lg font-semibold text-white">Archi</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="px-4 py-3 border-b border-slate-800">
            <WorkspaceSwitcher />
          </div>

          {/* Token Balance */}
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-slate-400">Tokens</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {tokenBalance.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 text-yellow-500 text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buy Tokens
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-archi-500/10 text-archi-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-archi-400' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Admin Link - Only for OWNER role */}
            {user.role === 'OWNER' && (
              <>
                <div className="border-t border-slate-800 my-3" />
                <Link
                  href="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <HiOutlineShieldCheck className="w-5 h-5" />
                  Admin Panel
                </Link>
              </>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-archi-500/20 flex items-center justify-center">
                <span className="text-archi-400 font-medium text-sm">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <HiOutlineLogout className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white -ml-2 mr-2"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/documents/upload"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors"
            >
              <HiOutlineDocumentText className="w-4 h-4" />
              Upload Document
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Token Purchase Modal */}
      <TokenPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => {
          fetchBalance();
          setShowPurchaseModal(false);
        }}
        currentBalance={tokenBalance}
      />
    </div>
  );
}
