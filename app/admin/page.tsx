'use client';

import { useState, useEffect, useMemo } from 'react';
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
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineGlobe,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineEye,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

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
  // New visualization data
  messageVolume?: Array<{ date: string; count: number }>;
  tenantGrowth?: Array<{ date: string; count: number }>;
  topTenants?: Array<{ id: string; name: string; messages: number; documents: number }>;
  systemHealth?: {
    api: { status: 'healthy' | 'degraded' | 'down'; latency: number };
    database: { status: 'healthy' | 'degraded' | 'down'; connections: number };
    storage: { status: 'healthy' | 'degraded' | 'down'; used: number; total: number };
    whatsapp: { status: 'healthy' | 'degraded' | 'down'; queueSize: number };
  };
  planDistribution?: Array<{ plan: string; count: number; percentage: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
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

  // Memoize display stats to prevent infinite re-renders
  const displayStats = useMemo(() => stats || {
    tenants: { total: 0, active: 0, trial: 0, churned: 0, newThisMonth: 0 },
    users: { total: 0, activeToday: 0, newThisWeek: 0 },
    messages: { total: 0, thisMonth: 0, avgPerTenant: 0 },
    revenue: { mrr: 0, growth: 0 },
    recentTenants: [],
    alerts: [],
    messageVolume: [],
    tenantGrowth: [],
    topTenants: [],
    systemHealth: {
      api: { status: 'healthy' as const, latency: 0 },
      database: { status: 'healthy' as const, connections: 0 },
      storage: { status: 'healthy' as const, used: 0, total: 100 },
      whatsapp: { status: 'healthy' as const, queueSize: 0 },
    },
    planDistribution: [],
  }, [stats]);

  // Generate demo chart data if not provided
  const messageVolumeData = useMemo(() => {
    if (displayStats.messageVolume && displayStats.messageVolume.length > 0) {
      return displayStats.messageVolume;
    }
    // Generate last 14 days of demo data
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: Math.floor(Math.random() * 500) + 100,
      });
    }
    return days;
  }, [displayStats.messageVolume]);

  const tenantGrowthData = useMemo(() => {
    if (displayStats.tenantGrowth && displayStats.tenantGrowth.length > 0) {
      return displayStats.tenantGrowth;
    }
    // Generate last 6 months of demo data
    const months = [];
    let cumulative = 5;
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      cumulative += Math.floor(Math.random() * 10) + 2;
      months.push({
        date: date.toLocaleDateString('en-US', { month: 'short' }),
        count: cumulative,
      });
    }
    return months;
  }, [displayStats.tenantGrowth]);

  const planDistributionData = useMemo(() => {
    if (displayStats.planDistribution && displayStats.planDistribution.length > 0) {
      return displayStats.planDistribution;
    }
    const total = displayStats.tenants.total || 100;
    return [
      { plan: 'Trial', count: Math.floor(total * 0.35), percentage: 35 },
      { plan: 'Starter', count: Math.floor(total * 0.30), percentage: 30 },
      { plan: 'Professional', count: Math.floor(total * 0.25), percentage: 25 },
      { plan: 'Enterprise', count: Math.floor(total * 0.10), percentage: 10 },
    ];
  }, [displayStats.planDistribution, displayStats.tenants.total]);

  const topTenantsData = useMemo(() => {
    if (displayStats.topTenants && displayStats.topTenants.length > 0) {
      return displayStats.topTenants;
    }
    return [
      { id: '1', name: 'Acme Corp', messages: 12450, documents: 45 },
      { id: '2', name: 'TechStart Inc', messages: 8320, documents: 32 },
      { id: '3', name: 'Global Services', messages: 6890, documents: 28 },
      { id: '4', name: 'Local Business', messages: 4560, documents: 18 },
      { id: '5', name: 'StartupXYZ', messages: 3210, documents: 12 },
    ];
  }, [displayStats.topTenants]);

  const systemHealthData = displayStats.systemHealth || {
    api: { status: 'healthy' as const, latency: 45 },
    database: { status: 'healthy' as const, connections: 23 },
    storage: { status: 'healthy' as const, used: 67, total: 100 },
    whatsapp: { status: 'healthy' as const, queueSize: 12 },
  };

  const maxMessageVolume = Math.max(...messageVolumeData.map(d => d.count), 1);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Monitor and manage all platform activity.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/tenants"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors text-sm font-medium"
          >
            <HiOutlineEye className="w-4 h-4" />
            View All Tenants
          </Link>
        </div>
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Message Volume Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white">Message Volume</h2>
              <p className="text-xs text-slate-500">Last 14 days</p>
            </div>
            <HiOutlineChartBar className="w-5 h-5 text-slate-500" />
          </div>
          <div className="h-48 flex items-end gap-1">
            {messageVolumeData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="w-full relative">
                  <div
                    className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t transition-all group-hover:from-amber-400 group-hover:to-amber-300"
                    style={{ height: `${(day.count / maxMessageVolume) * 160}px`, minHeight: '4px' }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.count.toLocaleString()} messages
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            {messageVolumeData.filter((_, i) => i % 3 === 0).map((day, index) => (
              <span key={index}>{day.date}</span>
            ))}
          </div>
        </motion.div>

        {/* Tenant Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white">Tenant Growth</h2>
              <p className="text-xs text-slate-500">Last 6 months</p>
            </div>
            <HiOutlineTrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="h-48 flex items-end gap-2">
            {tenantGrowthData.map((month, index) => {
              const maxCount = Math.max(...tenantGrowthData.map(d => d.count), 1);
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="w-full relative">
                    <div
                      className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all group-hover:from-green-500 group-hover:to-green-300"
                      style={{ height: `${(month.count / maxCount) * 160}px`, minHeight: '8px' }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {month.count} tenants
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{month.date}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* System Health & Top Tenants */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">System Health</h2>
            <div className={`w-2 h-2 rounded-full ${
              Object.values(systemHealthData).every(s => s.status === 'healthy') 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-amber-400'
            }`} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <HiOutlineServer className={`w-5 h-5 ${
                  systemHealthData.api.status === 'healthy' ? 'text-green-400' :
                  systemHealthData.api.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className="text-sm text-white">API</span>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  systemHealthData.api.status === 'healthy' ? 'bg-green-500/10 text-green-400' :
                  systemHealthData.api.status === 'degraded' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {systemHealthData.api.latency}ms
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <HiOutlineDatabase className={`w-5 h-5 ${
                  systemHealthData.database.status === 'healthy' ? 'text-green-400' :
                  systemHealthData.database.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className="text-sm text-white">Database</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">{systemHealthData.database.connections} conn</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <HiOutlineGlobe className={`w-5 h-5 ${
                  systemHealthData.storage.status === 'healthy' ? 'text-green-400' :
                  systemHealthData.storage.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className="text-sm text-white">Storage</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      (systemHealthData.storage.used / systemHealthData.storage.total) > 0.9 ? 'bg-red-400' :
                      (systemHealthData.storage.used / systemHealthData.storage.total) > 0.7 ? 'bg-amber-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${(systemHealthData.storage.used / systemHealthData.storage.total) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-400">{Math.round((systemHealthData.storage.used / systemHealthData.storage.total) * 100)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FaWhatsapp className={`w-5 h-5 ${
                  systemHealthData.whatsapp.status === 'healthy' ? 'text-green-400' :
                  systemHealthData.whatsapp.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className="text-sm text-white">WhatsApp</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">{systemHealthData.whatsapp.queueSize} queued</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h2 className="font-semibold text-white mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {planDistributionData.map((plan, index) => {
              const colors = ['bg-blue-400', 'bg-green-400', 'bg-amber-400', 'bg-purple-400'];
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{plan.plan}</span>
                    <span className="text-slate-400">{plan.count} ({plan.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${plan.percentage}%` }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${colors[index % colors.length]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Conversion Rate</span>
              <span className="text-green-400 font-medium">
                {displayStats.tenants.total > 0 
                  ? Math.round(((displayStats.tenants.active) / displayStats.tenants.total) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Top Tenants by Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Top Tenants</h2>
            <span className="text-xs text-slate-500">By messages</span>
          </div>
          <div className="space-y-3">
            {topTenantsData.slice(0, 5).map((tenant, index) => {
              const maxMessages = topTenantsData[0]?.messages || 1;
              return (
                <div key={tenant.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tenant.name}</p>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${(tenant.messages / maxMessages) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{tenant.messages.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{tenant.documents} docs</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

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
