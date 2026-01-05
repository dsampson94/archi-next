'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineDocumentText,
  HiOutlineChat,
  HiOutlineUserGroup,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineLightningBolt,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import OnboardingWizard from './OnboardingWizard';
import SetupChecklist from './SetupChecklist';

interface DashboardStats {
  documents: {
    total: number;
    processed: number;
    pending: number;
    failed: number;
  };
  conversations: {
    total: number;
    thisWeek: number;
    activeToday: number;
  };
  messages: {
    total: number;
    answered: number;
    handedOff: number;
    successRate: number;
  };
  users: {
    total: number;
    newThisWeek: number;
  };
  recentConversations: Array<{
    id: string;
    phoneNumber: string;
    lastMessage: string;
    lastMessageTime: string;
    status: string;
    handedOff: boolean;
  }>;
  topQuestions: Array<{
    query: string;
    count: number;
  }>;
}

const formatPhoneNumber = (phone: string) => {
  // Mask middle digits for privacy
  if (phone.length > 6) {
    return phone.slice(0, 6) + ' xxx ' + phone.slice(-4);
  }
  return phone;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setUserName(data.userName || '');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      try {
        const res = await fetch('/api/onboarding/status');
        const data = await res.json();
        if (!data.completed) {
          setIsNewUser(true);
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };
    checkOnboarding();
  }, []);

  // Loading state
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
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-800" />
                <div className="h-4 w-20 bg-slate-800 rounded" />
              </div>
              <div className="mt-4">
                <div className="h-8 w-16 bg-slate-800 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state - no data yet
  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome to Archi! 👋</h1>
          <p className="text-slate-400 mt-1">Let's get started setting up your AI assistant.</p>
        </div>
        
        <div className="bg-archi-500/5 border border-archi-500/20 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-archi-500/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineLightningBolt className="w-8 h-8 text-archi-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Get Started</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Upload your first document to start training your AI assistant. Once you've uploaded documents,
            your customers and staff can ask questions via WhatsApp.
          </p>
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors font-medium"
          >
            <HiOutlineDocumentText className="w-5 h-5" />
            Upload Your First Document
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Documents',
      value: stats.documents.total.toString(),
      icon: HiOutlineDocumentText,
      change: stats.documents.pending > 0 ? `${stats.documents.pending} processing` : `${stats.documents.processed} processed`,
      changeType: stats.documents.failed > 0 ? 'warning' : 'positive',
    },
    {
      name: 'Conversations',
      value: stats.conversations.total.toString(),
      icon: HiOutlineChat,
      change: stats.conversations.thisWeek > 0 ? `+${stats.conversations.thisWeek} this week` : 'No new this week',
      changeType: stats.conversations.thisWeek > 0 ? 'positive' : 'neutral',
    },
    {
      name: 'Questions Answered',
      value: stats.messages.answered.toLocaleString(),
      icon: HiOutlineCheckCircle,
      change: `${stats.messages.successRate}% success rate`,
      changeType: stats.messages.successRate >= 80 ? 'positive' : 'neutral',
    },
    {
      name: 'Active Users',
      value: stats.users.total.toString(),
      icon: HiOutlineUserGroup,
      change: stats.users.newThisWeek > 0 ? `+${stats.users.newThisWeek} new users` : 'No new users',
      changeType: stats.users.newThisWeek > 0 ? 'positive' : 'neutral',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding Wizard */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        tenantId="demo-tenant"
      />

      {/* Setup Checklist - Shows progress for new users */}
      {isNewUser && !showOnboarding && (
        <SetupChecklist onStartWizard={() => setShowOnboarding(true)} />
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back{userName ? `, ${userName}` : ''}! 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening with Archi today.</p>
        </div>
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-archi-500/10 hover:bg-archi-500/20 text-archi-400 rounded-lg transition-colors text-sm font-medium"
        >
          <FaWhatsapp className="w-4 h-4" />
          View Live Conversations
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-archi-400" />
              </div>
              <span className={`text-xs font-medium ${
                stat.changeType === 'positive' ? 'text-green-400' :
                stat.changeType === 'warning' ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.name}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Conversations</h2>
            <Link
              href="/dashboard/conversations"
              className="text-sm text-archi-400 hover:text-archi-300 flex items-center gap-1"
            >
              View all <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {stats.recentConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <HiOutlineChat className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No conversations yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Conversations will appear here once people start messaging
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {stats.recentConversations.map((conversation) => (
                <div key={conversation.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {formatPhoneNumber(conversation.phoneNumber)}
                        </span>
                        {conversation.handedOff ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">
                            <HiOutlineExclamationCircle className="w-3 h-3 mr-1" />
                            Handed off
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                            <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
                            Answered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 truncate mt-1">{conversation.lastMessage}</p>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
                      <HiOutlineClock className="w-3 h-3" />
                      {formatTimeAgo(conversation.lastMessageTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Top Questions This Week</h2>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-archi-400 hover:text-archi-300 flex items-center gap-1"
            >
              Analytics <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {stats.topQuestions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <HiOutlineTrendingUp className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No questions yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Popular questions will appear here
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {stats.topQuestions.map((item, index) => {
                const maxCount = stats.topQuestions[0]?.count || 1;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.query}</p>
                      <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-archi-500 rounded-full transition-all duration-500"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-400">{item.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-archi-500/5 border border-archi-500/20 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Quick Actions</h2>
          <button
            onClick={() => setShowOnboarding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-archi-500 to-purple-500 hover:from-archi-400 hover:to-purple-400 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-archi-500/20"
          >
            <HiOutlineLightningBolt className="w-4 h-4" />
            Setup Wizard
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-archi-500/20 to-purple-500/20 hover:from-archi-500/30 hover:to-purple-500/30 border border-archi-500/30 rounded-lg transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-archi-500 to-purple-500 flex items-center justify-center">
              <HiOutlineLightningBolt className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">New Setup</p>
              <p className="text-xs text-slate-400">Start guided wizard</p>
            </div>
          </button>
          <Link
            href="/dashboard/documents"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center">
              <HiOutlineDocumentText className="w-5 h-5 text-archi-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Upload Document</p>
              <p className="text-xs text-slate-400">Add to knowledge base</p>
            </div>
          </Link>
          <Link
            href="/dashboard/agents"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center">
              <HiOutlineTrendingUp className="w-5 h-5 text-archi-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Configure Agent</p>
              <p className="text-xs text-slate-400">Update AI settings</p>
            </div>
          </Link>
          <Link
            href="/dashboard/whatsapp"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FaWhatsapp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">WhatsApp Setup</p>
              <p className="text-xs text-slate-400">Connect your number</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
