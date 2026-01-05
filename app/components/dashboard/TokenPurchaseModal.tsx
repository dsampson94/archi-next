'use client';

import { useState, useEffect } from 'react';
import {
  Coins,
  Sparkles,
  Check,
  X,
  CreditCard,
  Zap,
  Rocket,
  Building2,
  Loader2,
} from 'lucide-react';

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  bonus: number;
  price: number;
  popular?: boolean;
}

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentBalance?: number;
}

const PACKAGE_ICONS = {
  starter: Zap,
  basic: Sparkles,
  pro: Rocket,
  enterprise: Building2,
};

export default function TokenPurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  currentBalance = 0,
}: TokenPurchaseModalProps) {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      setStep('select');
      setSelectedPackage(null);
      setError('');
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/billing/balance');
      const data = await res.json();
      if (data.packages) {
        setPackages(data.packages);
        // Pre-select popular package
        const popular = data.packages.find((p: TokenPackage) => p.popular);
        if (popular) setSelectedPackage(popular.id);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    setError('');

    try {
      // Create PayPal order
      const res = await fetch('/api/billing/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Redirect to PayPal
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (!isOpen) return null;

  const selected = packages.find((p) => p.id === selectedPackage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Buy Tokens</h2>
              <p className="text-sm text-gray-400">
                Current balance: {formatNumber(currentBalance)} tokens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Package Selection */}
          <div className="grid grid-cols-2 gap-4">
            {packages.map((pkg) => {
              const Icon = PACKAGE_ICONS[pkg.id as keyof typeof PACKAGE_ICONS] || Coins;
              const isSelected = selectedPackage === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-500/20' : 'bg-gray-700'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-blue-400' : 'text-gray-400'
                      }`} />
                    </div>
                    {isSelected && (
                      <div className="p-1 bg-blue-500 rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-white mb-1">{pkg.name}</h3>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-white">
                      ${pkg.price}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {formatNumber(pkg.tokens)} tokens
                    </p>
                    {pkg.bonus > 0 && (
                      <p className="text-sm text-green-400 font-medium">
                        +{formatNumber(pkg.bonus)} bonus tokens
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      Total: {formatNumber(pkg.tokens + pkg.bonus)} tokens
                    </p>
                    <p className="text-xs text-gray-500">
                      ${((pkg.price / (pkg.tokens + pkg.bonus)) * 1000).toFixed(2)} per 1K tokens
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary */}
          {selected && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Selected Package</span>
                <span className="font-semibold text-white">{selected.name}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Tokens</span>
                <span className="text-white">{formatNumber(selected.tokens)}</span>
              </div>
              {selected.bonus > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400">Bonus Tokens</span>
                  <span className="text-green-400">+{formatNumber(selected.bonus)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <span className="font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white">${selected.price}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-800/50 border-t border-gray-700">
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay with PayPal
              </>
            )}
          </button>
          
          <p className="mt-3 text-xs text-gray-500 text-center">
            Secure payment powered by PayPal. Tokens never expire.
          </p>
        </div>
      </div>
    </div>
  );
}
