'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClipboard,
  HiOutlineExternalLink,
  HiOutlineRefresh,
  HiOutlineSave,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

interface WhatsAppConfig {
  id?: string;
  phoneNumber: string;
  displayName: string;
  isActive: boolean;
  verified: boolean;
}

export default function WhatsAppSetupPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    phoneNumber: '',
    displayName: '',
    isActive: false,
    verified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Webhook URL for this tenant
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/whatsapp`
    : '';

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/whatsapp/config', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FaWhatsapp className="w-8 h-8 text-green-400" />
          WhatsApp Setup
        </h1>
        <p className="text-slate-400 mt-1">
          Connect your WhatsApp Business number to start receiving messages
        </p>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl border ${
          config.verified
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-amber-500/5 border-amber-500/20'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            config.verified ? 'bg-green-500/20' : 'bg-amber-500/20'
          }`}>
            {config.verified ? (
              <HiOutlineCheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <HiOutlineExclamationCircle className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${config.verified ? 'text-green-400' : 'text-amber-400'}`}>
              {config.verified ? 'WhatsApp Connected' : 'Setup Required'}
            </h3>
            <p className="text-sm text-slate-400">
              {config.verified
                ? `Messages are being received on ${config.phoneNumber}`
                : 'Complete the steps below to connect your WhatsApp number'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Setup Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white">Setup Guide</h2>
        </div>
        <div className="p-5 space-y-6">
          {/* Step 1: Twilio Account */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-archi-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-archi-400">
              1
            </div>
            <div>
              <h3 className="font-medium text-white">Create a Twilio Account</h3>
              <p className="text-sm text-slate-400 mt-1">
                Sign up for Twilio and enable WhatsApp messaging in your account.
              </p>
              <a
                href="https://www.twilio.com/try-twilio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-archi-400 hover:text-archi-300 mt-2"
              >
                Go to Twilio <HiOutlineExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Step 2: WhatsApp Sandbox or Number */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-archi-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-archi-400">
              2
            </div>
            <div>
              <h3 className="font-medium text-white">Activate WhatsApp Sandbox</h3>
              <p className="text-sm text-slate-400 mt-1">
                For testing, use Twilio's WhatsApp Sandbox. For production, register your own WhatsApp Business number.
              </p>
              <a
                href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-archi-400 hover:text-archi-300 mt-2"
              >
                WhatsApp Sandbox Setup <HiOutlineExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Step 3: Configure Webhook */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-archi-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-archi-400">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">Configure Webhook URL</h3>
              <p className="text-sm text-slate-400 mt-1">
                In Twilio Console, set this URL as your WhatsApp webhook endpoint:
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-sm text-green-400 font-mono overflow-x-auto">
                  {webhookUrl}
                </code>
                <button
                  onClick={copyWebhookUrl}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <HiOutlineClipboard className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Enter Phone Number */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-archi-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-archi-400">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">Enter Your WhatsApp Number</h3>
              <p className="text-sm text-slate-400 mt-1 mb-3">
                Enter the phone number you're using for WhatsApp Business (with country code).
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={config.phoneNumber}
                    onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                    placeholder="+27821234567"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-archi-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={config.displayName}
                    onChange={(e) => setConfig({ ...config, displayName: e.target.value })}
                    placeholder="My Business"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-archi-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-5 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !config.phoneNumber}
            className="inline-flex items-center gap-2 px-4 py-2 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <HiOutlineCheckCircle className="w-5 h-5" />
            ) : (
              <HiOutlineSave className="w-5 h-5" />
            )}
            {saveSuccess ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </motion.div>

      {/* Environment Variables Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
      >
        <h3 className="font-semibold text-white mb-3">Required Environment Variables</h3>
        <p className="text-sm text-slate-400 mb-3">
          Make sure these are set in your hosting environment:
        </p>
        <code className="block p-3 bg-slate-800 rounded-lg text-sm text-slate-300 font-mono whitespace-pre">
{`TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886`}
        </code>
      </motion.div>
    </div>
  );
}
