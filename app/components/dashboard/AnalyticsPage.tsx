'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineChartBar,
  HiOutlineChat,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

interface AnalyticsData {
  overview: {
    totalQueries: number;
    answeredByAI: number;
    handedOff: number;
    avgResponseTime: number;
    successRate: number;
  };
  daily: Array<{
    date: string;
    queries: number;
    answered: number;
    handedOff: number;
  }>;
  topQueries: Array<{
    query: string;
    count: number;
    avgConfidence: number;
  }>;
  documentUsage: Array<{
    title: string;
    citations: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              <div className="h-8 bg-slate-800 rounded w-16 mb-2" />
              <div className="h-4 bg-slate-800 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Generate mock data if no real data
  const mockData: AnalyticsData = data || {
    overview: {
      totalQueries: 0,
      answeredByAI: 0,
      handedOff: 0,
      avgResponseTime: 0,
      successRate: 0,
    },
    daily: [],
    topQueries: [],
    documentUsage: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">
            Track your AI assistant's performance
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-archi-500/20 text-archi-400 border border-archi-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center">
              <HiOutlineChat className="w-5 h-5 text-archi-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{mockData.overview.totalQueries}</p>
            <p className="text-sm text-slate-400">Total Queries</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <HiOutlineCheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{mockData.overview.successRate}%</p>
            <p className="text-sm text-slate-400">Success Rate</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <HiOutlineExclamationCircle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{mockData.overview.handedOff}</p>
            <p className="text-sm text-slate-400">Handed Off</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HiOutlineClock className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{mockData.overview.avgResponseTime}ms</p>
            <p className="text-sm text-slate-400">Avg Response Time</p>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Queries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-semibold text-white">Top Questions</h2>
          </div>
          {mockData.topQueries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <HiOutlineChartBar className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No queries yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {mockData.topQueries.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.query}</p>
                    <p className="text-xs text-slate-500">
                      {item.count} times • {Math.round(item.avgConfidence * 100)}% avg confidence
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Document Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-semibold text-white">Most Cited Documents</h2>
          </div>
          {mockData.documentUsage.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <HiOutlineDocumentText className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No document citations yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {mockData.documentUsage.map((doc, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-archi-500/10 flex items-center justify-center text-sm">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{doc.title}</p>
                  </div>
                  <span className="text-sm font-medium text-archi-400">{doc.citations}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Empty State Hint */}
      {mockData.overview.totalQueries === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-archi-500/5 border border-archi-500/20 rounded-xl p-6 text-center"
        >
          <HiOutlineTrendingUp className="w-8 h-8 text-archi-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">Start Tracking</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Analytics will populate once people start asking questions via WhatsApp. 
            Make sure you've uploaded documents and connected your WhatsApp number.
          </p>
        </motion.div>
      )}
    </div>
  );
}
