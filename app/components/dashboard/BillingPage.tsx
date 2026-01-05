'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';
import TokenPurchaseModal from './TokenPurchaseModal';

interface TokenTransaction {
  id: string;
  type: 'PURCHASE' | 'USAGE' | 'BONUS' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  balance: number;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
}

interface ModelUsage {
  model: string;
  totalTokens: number;
  count: number;
}

interface BillingData {
  balance: number;
  monthlyUsage: number;
  recentTransactions: TokenTransaction[];
  modelUsage?: ModelUsage[];
}

const transactionIcons = {
  PURCHASE: CreditCard,
  USAGE: TrendingDown,
  BONUS: Sparkles,
  REFUND: ArrowUpRight,
  ADJUSTMENT: Clock,
};

const transactionColors = {
  PURCHASE: 'text-green-400 bg-green-500/20',
  USAGE: 'text-red-400 bg-red-500/20',
  BONUS: 'text-purple-400 bg-purple-500/20',
  REFUND: 'text-blue-400 bg-blue-500/20',
  ADJUSTMENT: 'text-yellow-400 bg-yellow-500/20',
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const res = await fetch('/api/billing/balance');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => num.toLocaleString();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Tokens</h1>
          <p className="text-slate-400 mt-1">
            Manage your token balance and view usage history
          </p>
        </div>
        <button
          onClick={() => setShowPurchaseModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/25"
        >
          <Coins className="w-5 h-5" />
          Buy Tokens
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Token Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-yellow-500/80">Token Balance</p>
              <p className="text-3xl font-bold text-white">
                {formatNumber(data?.balance || 0)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Add Tokens
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Monthly Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">This Month</p>
              <p className="text-3xl font-bold text-white">
                {formatNumber(data?.monthlyUsage || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Tokens used since {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Info className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pay As You Go</p>
              <p className="text-lg font-semibold text-white">No Subscriptions</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Only pay for what you use. Tokens never expire.
          </p>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl"
      >
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Recent Activity
          </h2>
        </div>

        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {data.recentTransactions.map((tx) => {
              const Icon = transactionIcons[tx.type] || Clock;
              const colorClass = transactionColors[tx.type] || 'text-slate-400 bg-slate-500/20';
              const isPositive = ['PURCHASE', 'BONUS', 'REFUND'].includes(tx.type);

              return (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {tx.type === 'USAGE' ? 'AI Response' : tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{formatDate(tx.createdAt)}</span>
                        {tx.model && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">{tx.model}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : '-'}{formatNumber(Math.abs(tx.amount))}
                    </p>
                    <p className="text-sm text-slate-500">
                      Balance: {formatNumber(tx.balance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No transactions yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Your token activity will appear here
            </p>
          </div>
        )}
      </motion.div>

      {/* Pricing Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6"
      >
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          How Token Pricing Works
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400 mb-2">Token costs vary by model:</p>
            <ul className="space-y-1 text-slate-300">
              <li>• <span className="text-green-400">GPT-4o Mini</span> - Most affordable</li>
              <li>• <span className="text-blue-400">Claude 3 Sonnet</span> - Good balance</li>
              <li>• <span className="text-purple-400">GPT-4 Turbo</span> - High quality</li>
            </ul>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Token packages available:</p>
            <ul className="space-y-1 text-slate-300">
              <li>• Starter: 5,000 tokens for $5</li>
              <li>• Basic: 25,000 + 2,500 bonus for $20</li>
              <li>• Pro: 100,000 + 15,000 bonus for $75</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Purchase Modal */}
      <TokenPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => {
          fetchBillingData();
          setShowPurchaseModal(false);
        }}
        currentBalance={data?.balance || 0}
      />
    </div>
  );
}
