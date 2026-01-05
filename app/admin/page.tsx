'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineChat,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineTrendingUp,
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineCog,
} from 'react-icons/hi';

interface AdminStats {
  tenants: {
    total: number;
    active: number;
    trial: number;
    churned: number;
    newThisMonth: number;
  };
  users: {
    total: number;
    activeToday: number;
    newThisWeek: number;
  };
  messages: {
    total: number;
    thisMonth: number;
    avgPerTenant: number;
  };
  revenue: {
    mrr: number;
    growth: number;
  };
  recentTenants: Array<{
    id: string;
    name: string;
    plan: string;
    status: string;
    usersCount: number;
    messagesCount: number;
    createdAt: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    tenantName?: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 animate-pulse">
              <div className="h-8 w-16 bg-slate-800 rounded mb-2" />
              <div className="h-4 w-24 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Demo data if no stats
  const displayStats = stats || {
    tenants: { total: 0, active: 0, trial: 0, churned: 0, newThisMonth: 0 },
    users: { total: 0, activeToday: 0, newThisWeek: 0 },
    messages: { total: 0, thisMonth: 0, avgPerTenant: 0 },
    revenue: { mrr: 0, growth: 0 },
    recentTenants: [],
    alerts: [],
  };

  const statCards = [
    {
      name: 'Total Tenants',
      value: displayStats.tenants.total.toString(),
      icon: HiOutlineOfficeBuilding,
      change: `${displayStats.tenants.newThisMonth} new this month`,
      changeType: displayStats.tenants.newThisMonth > 0 ? 'positive' : 'neutral',
      href: '/admin/tenants',
      color: 'amber',
    },
    {
      name: 'Total Users',
      value: displayStats.users.total.toString(),
      icon: HiOutlineUserGroup,
      change: `${displayStats.users.activeToday} active today`,
      changeType: displayStats.users.activeToday > 0 ? 'positive' : 'neutral',
      href: '/admin/users',
      color: 'blue',
    },
    {
      name: 'Messages Sent',
      value: displayStats.messages.thisMonth.toLocaleString(),
      icon: HiOutlineChat,
      change: `${displayStats.messages.avgPerTenant} avg per tenant`,
      changeType: 'neutral',
      href: '/admin/analytics',
      color: 'green',
    },
    {
      name: 'Monthly Revenue',
      value: `R${displayStats.revenue.mrr.toLocaleString()}`,
      icon: HiOutlineCurrencyDollar,
      change: displayStats.revenue.growth >= 0 ? `+${displayStats.revenue.growth}% growth` : `${displayStats.revenue.growth}% decline`,
      changeType: displayStats.revenue.growth >= 0 ? 'positive' : 'negative',
      href: '/admin/billing',
      color: 'purple',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-400';
      case 'trial':
        return 'bg-blue-500/10 text-blue-400';
      case 'suspended':
        return 'bg-red-500/10 text-red-400';
      case 'churned':
        return 'bg-slate-500/10 text-slate-400';
      default:
        return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-400';
      case 'professional':
        return 'bg-amber-500/10 text-amber-400';
      case 'starter':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Monitor and manage all platform activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={stat.href}
              className="block bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <span className={`text-xs font-medium ${
                  stat.changeType === 'positive' ? 'text-green-400' :
                  stat.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.name}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Tenant Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
      >
        <h2 className="font-semibold text-white mb-4">Tenant Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
            <p className="text-2xl font-bold text-green-400">{displayStats.tenants.active}</p>
            <p className="text-sm text-slate-400">Active</p>
          </div>
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">{displayStats.tenants.trial}</p>
            <p className="text-sm text-slate-400">On Trial</p>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-2xl font-bold text-amber-400">{displayStats.tenants.newThisMonth}</p>
            <p className="text-sm text-slate-400">New This Month</p>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-2xl font-bold text-red-400">{displayStats.tenants.churned}</p>
            <p className="text-sm text-slate-400">Churned</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Tenants</h2>
            <Link
              href="/admin/tenants"
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View all <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {displayStats.recentTenants.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <HiOutlineOfficeBuilding className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No tenants yet</p>
              <p className="text-xs text-slate-500 mt-1">New signups will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {displayStats.recentTenants.slice(0, 5).map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/admin/tenants/${tenant.id}`}
                  className="p-4 hover:bg-slate-800/30 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{tenant.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${getPlanColor(tenant.plan)}`}>
                          {tenant.plan}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">{tenant.usersCount} users</p>
                      <p className="text-xs text-slate-500">{tenant.messagesCount} messages</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Alerts & Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">System Alerts</h2>
            <Link
              href="/admin/notifications"
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View all <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {displayStats.alerts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <HiOutlineCheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm text-slate-400">All systems operational</p>
              <p className="text-xs text-slate-500 mt-1">No alerts or warnings</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {displayStats.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.type === 'error' ? 'bg-red-500/10' :
                      alert.type === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                    }`}>
                      <HiOutlineExclamationCircle className={`w-5 h-5 ${
                        alert.type === 'error' ? 'text-red-400' :
                        alert.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{alert.message}</p>
                      {alert.tenantName && (
                        <p className="text-xs text-slate-500 mt-1">Tenant: {alert.tenantName}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <HiOutlineClock className="w-3 h-3" />
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6"
      >
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/tenants/new"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <HiOutlineOfficeBuilding className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Add Tenant</p>
              <p className="text-xs text-slate-400">Create new account</p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HiOutlineUserGroup className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Manage Users</p>
              <p className="text-xs text-slate-400">View all users</p>
            </div>
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <HiOutlineClipboardList className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Generate Report</p>
              <p className="text-xs text-slate-400">Export platform data</p>
            </div>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <HiOutlineCog className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Platform Settings</p>
              <p className="text-xs text-slate-400">Configure system</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
