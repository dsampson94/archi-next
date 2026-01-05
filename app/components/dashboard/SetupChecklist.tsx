'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineCog,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlinePhone,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

interface SetupStatus {
  agentConfigured: boolean;
  documentsUploaded: boolean;
  documentsProcessed: boolean;
  whatsappConnected: boolean;
  customersAdded: boolean;
}

interface SetupChecklistProps {
  onStartWizard?: () => void;
}

export default function SetupChecklist({ onStartWizard }: SetupChecklistProps) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/onboarding/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data.onboarding?.steps || null);
          
          // Auto-collapse if all done
          if (data.onboarding?.completionPercent === 100) {
            setIsExpanded(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch setup status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!status) return null;

  const steps = [
    {
      id: 'agent',
      title: 'Configure AI Agent',
      description: 'Set up your bot\'s personality and responses',
      completed: status.agentConfigured,
      href: '/dashboard/agents',
      icon: HiOutlineCog,
    },
    {
      id: 'documents',
      title: 'Upload Knowledge Base',
      description: 'Add documents for your bot to learn from',
      completed: status.documentsUploaded,
      href: '/dashboard/documents',
      icon: HiOutlineDocumentText,
    },
    {
      id: 'whatsapp',
      title: 'Connect WhatsApp',
      description: 'Link your WhatsApp Business number',
      completed: status.whatsappConnected,
      href: '/dashboard/whatsapp',
      icon: FaWhatsapp,
      critical: true,
    },
    {
      id: 'customers',
      title: 'Add Customers',
      description: 'Import phone numbers who can message your bot',
      completed: status.customersAdded,
      href: '/dashboard/conversations',
      icon: HiOutlineUserGroup,
      optional: true,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allComplete = completedCount === steps.length;

  // Find the first incomplete critical step
  const nextStep = steps.find((s) => !s.completed && !s.optional);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900/50 border rounded-xl overflow-hidden ${
        allComplete ? 'border-green-500/30' : 'border-amber-500/30'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {allComplete ? (
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <HiOutlineCheckCircle className="w-5 h-5 text-green-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <HiOutlineExclamationCircle className="w-5 h-5 text-amber-400" />
            </div>
          )}
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">
              {allComplete ? 'Setup Complete!' : 'Complete Your Setup'}
            </h3>
            <p className="text-xs text-slate-400">
              {completedCount}/{steps.length} steps completed
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                allComplete ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">{progressPercent}%</span>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  step.completed
                    ? 'bg-slate-800/30 opacity-60'
                    : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500/20 text-green-400'
                      : step.critical
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {step.completed ? (
                    <HiOutlineCheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${step.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {step.title}
                    </p>
                    {step.optional && !step.completed && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                        Optional
                      </span>
                    )}
                    {step.critical && !step.completed && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{step.description}</p>
                </div>
                {!step.completed && (
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-500" />
                )}
              </Link>
            );
          })}

          {/* Next Step CTA */}
          {nextStep && (
            <Link
              href={nextStep.href}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Continue Setup: {nextStep.title}
              <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* All Complete Message */}
          {allComplete && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-sm text-green-400">
                🎉 Your WhatsApp AI assistant is ready! Customers can now message your number.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
