'use client';

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
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

// Mock data - replace with real API calls
const stats = [
  { name: 'Total Documents', value: '24', icon: HiOutlineDocumentText, change: '+3 this week', changeType: 'positive' },
  { name: 'Conversations', value: '156', icon: HiOutlineChat, change: '+12% from last week', changeType: 'positive' },
  { name: 'Questions Answered', value: '1,234', icon: HiOutlineCheckCircle, change: '89% success rate', changeType: 'positive' },
  { name: 'Active Users', value: '47', icon: HiOutlineUserGroup, change: '+5 new users', changeType: 'positive' },
];

const recentConversations = [
  { id: 1, user: '+27 82 xxx xxxx', lastMessage: 'What is the leave policy?', time: '2 min ago', status: 'answered' },
  { id: 2, user: '+27 71 xxx xxxx', lastMessage: 'How do I submit an expense claim?', time: '15 min ago', status: 'answered' },
  { id: 3, user: '+27 83 xxx xxxx', lastMessage: 'Who is the IT support contact?', time: '1 hour ago', status: 'handed-off' },
  { id: 4, user: '+27 72 xxx xxxx', lastMessage: 'What are the office hours?', time: '2 hours ago', status: 'answered' },
];

const topQuestions = [
  { question: 'What is the leave policy?', count: 45 },
  { question: 'How do I submit expenses?', count: 32 },
  { question: 'What are the office hours?', count: 28 },
  { question: 'Who do I contact for IT support?', count: 21 },
  { question: 'Where is the parking?', count: 18 },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back! 👋</h1>
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
        {stats.map((stat, index) => (
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
                stat.changeType === 'positive' ? 'text-green-400' : 'text-slate-400'
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
          <div className="divide-y divide-slate-800">
            {recentConversations.map((conversation) => (
              <div key={conversation.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{conversation.user}</span>
                      {conversation.status === 'answered' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                          <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
                          Answered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">
                          <HiOutlineExclamationCircle className="w-3 h-3 mr-1" />
                          Handed off
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate mt-1">{conversation.lastMessage}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
                    <HiOutlineClock className="w-3 h-3" />
                    {conversation.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
          <div className="p-4 space-y-3">
            {topQuestions.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.question}</p>
                  <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-archi-500 rounded-full"
                      style={{ width: `${(item.count / 50) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-400">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-archi-500/5 border border-archi-500/20 rounded-xl p-6"
      >
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/dashboard/documents/upload"
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
              <p className="font-medium text-white text-sm">Train Agent</p>
              <p className="text-xs text-slate-400">Update instructions</p>
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
          <Link
            href="/dashboard/team"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center">
              <HiOutlineUserGroup className="w-5 h-5 text-archi-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Invite Team</p>
              <p className="text-xs text-slate-400">Add team members</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
