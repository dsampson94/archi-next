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
  HiOutlineInformationCircle,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

interface WhatsAppConfig {
  id?: string;
  phoneNumber: string;
  displayName: string;
  isActive: boolean;
  verified: boolean;
}

interface SetupStep {
  id: number;
  title: string;
  completed: boolean;
}

type Environment = 'sandbox' | 'production' | null;

export default function WhatsAppSetupPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    phoneNumber: '',
    displayName: '',
    isActive: false,
    verified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [environment, setEnvironment] = useState<Environment>(null);
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    phoneNumber?: string;
    displayName?: string;
  }>({});

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
          // Auto-detect environment based on phone number
          if (data.config.phoneNumber.includes('+14155238886')) {
            setEnvironment('sandbox');
          } else if (data.config.phoneNumber) {
            setEnvironment('production');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    if (!config.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(config.phoneNumber)) {
      errors.phoneNumber = 'Invalid phone number format (e.g., +1234567890)';
    }
    
    if (!config.displayName || config.displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setTestResult(null);
    
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
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.phoneNumber) {
      alert('Please save your configuration first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate test - in production, this would actually send a test message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo: randomly succeed/fail
      const success = Math.random() > 0.3;
      setTestResult(success ? 'success' : 'error');
      
      if (!success) {
        alert('Connection test failed. Please verify your Twilio credentials and webhook configuration.');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult('error');
    } finally {
      setIsTesting(false);
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <FaWhatsapp className="w-7 h-7 text-white" />
            </div>
            WhatsApp Business Setup
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Connect your WhatsApp Business account to enable automated customer conversations
          </p>
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl border-2 ${
          config.verified && config.isActive
            ? 'bg-green-500/10 border-green-500/30'
            : config.phoneNumber
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              config.verified && config.isActive
                ? 'bg-green-500/20' 
                : config.phoneNumber
                ? 'bg-blue-500/20'
                : 'bg-amber-500/20'
            }`}>
              {config.verified && config.isActive ? (
                <HiOutlineCheckCircle className="w-8 h-8 text-green-400" />
              ) : config.phoneNumber ? (
                <HiOutlineInformationCircle className="w-8 h-8 text-blue-400" />
              ) : (
                <HiOutlineExclamationCircle className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                config.verified && config.isActive
                  ? 'text-green-400' 
                  : config.phoneNumber
                  ? 'text-blue-400'
                  : 'text-amber-400'
              }`}>
                {config.verified && config.isActive
                  ? '✓ WhatsApp Connected & Active'
                  : config.phoneNumber
                  ? 'Configuration Saved'
                  : 'Setup Not Complete'}
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                {config.verified && config.isActive
                  ? `Your WhatsApp Business is live on ${config.phoneNumber}`
                  : config.phoneNumber
                  ? 'Complete the steps below and test your connection'
                  : 'Follow the setup guide below to get started'}
              </p>
              {config.phoneNumber && (
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-slate-400">
                    <strong>Phone:</strong> {config.phoneNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    <strong>Name:</strong> {config.displayName}
                  </span>
                </div>
              )}
            </div>
          </div>
          {config.phoneNumber && (
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Testing...
                </>
              ) : testResult === 'success' ? (
                <>
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  Test Passed
                </>
              ) : testResult === 'error' ? (
                <>
                  <HiOutlineExclamationCircle className="w-5 h-5" />
                  Test Failed
                </>
              ) : (
                <>
                  <HiOutlineLightningBolt className="w-5 h-5" />
                  Test Connection
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Environment Selection */}
      {!config.phoneNumber && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h2 className="font-semibold text-white text-lg mb-4">Choose Your Setup Type</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Sandbox Option */}
            <button
              onClick={() => setEnvironment('sandbox')}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                environment === 'sandbox'
                  ? 'border-archi-500 bg-archi-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <HiOutlineLightningBolt className="w-6 h-6 text-blue-400" />
                </div>
                {environment === 'sandbox' && (
                  <HiOutlineCheckCircle className="w-6 h-6 text-archi-400" />
                )}
              </div>
              <h3 className="font-semibold text-white mb-2">Testing (Sandbox)</h3>
              <p className="text-sm text-slate-400 mb-3">
                Perfect for development and testing. Quick to set up, no business verification required.
              </p>
              <div className="space-y-1">
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Free & instant setup
                </div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  No business verification
                </div>
                <div className="text-xs text-amber-400 flex items-center gap-1">
                  <HiOutlineInformationCircle className="w-4 h-4" />
                  Limited to test numbers
                </div>
              </div>
            </button>

            {/* Production Option */}
            <button
              onClick={() => setEnvironment('production')}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                environment === 'production'
                  ? 'border-archi-500 bg-archi-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <HiOutlineShieldCheck className="w-6 h-6 text-green-400" />
                </div>
                {environment === 'production' && (
                  <HiOutlineCheckCircle className="w-6 h-6 text-archi-400" />
                )}
              </div>
              <h3 className="font-semibold text-white mb-2">Production (Live)</h3>
              <p className="text-sm text-slate-400 mb-3">
                For live customer interactions. Requires WhatsApp Business API approval.
              </p>
              <div className="space-y-1">
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Message any customer
                </div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Professional branding
                </div>
                <div className="text-xs text-amber-400 flex items-center gap-1">
                  <HiOutlineInformationCircle className="w-4 h-4" />
                  Requires approval (2-3 days)
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* Setup Steps */}
      {environment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-archi-500/10 to-transparent">
            <h2 className="font-semibold text-white text-lg">
              {environment === 'sandbox' ? 'Sandbox Setup Guide' : 'Production Setup Guide'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {environment === 'sandbox' 
                ? 'Get started with testing in minutes'
                : 'Complete these steps to go live with WhatsApp Business'}
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Step 1: Twilio Account */}
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-archi-500 to-archi-600 flex items-center justify-center shrink-0 text-base font-bold text-white shadow-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-base mb-2">Create Twilio Account</h3>
                <p className="text-sm text-slate-400 mb-3">
                  {environment === 'sandbox'
                    ? 'Sign up for a free Twilio account. You\'ll get free credits to test WhatsApp messaging.'
                    : 'Sign up for Twilio and upgrade to a paid account for production WhatsApp API access.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://www.twilio.com/try-twilio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-archi-500 hover:bg-archi-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign Up for Twilio <HiOutlineExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.twilio.com/docs/whatsapp/quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <HiOutlineInformationCircle className="w-4 h-4" />
                    View Documentation
                  </a>
                </div>
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300 flex items-start gap-2">
                    <HiOutlineInformationCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>After signing up, note your <strong>Account SID</strong> and <strong>Auth Token</strong> from the Twilio Console dashboard.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: WhatsApp Setup */}
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-archi-500 to-archi-600 flex items-center justify-center shrink-0 text-base font-bold text-white shadow-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-base mb-2">
                  {environment === 'sandbox' ? 'Activate WhatsApp Sandbox' : 'Register WhatsApp Business Number'}
                </h3>
                <p className="text-sm text-slate-400 mb-3">
                  {environment === 'sandbox'
                    ? 'Use Twilio\'s sandbox for instant testing - no approval needed. You can message yourself and test numbers.'
                    : 'Register your business phone number with WhatsApp Business API. This requires Facebook Business Manager verification.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={environment === 'sandbox'
                      ? "https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
                      : "https://www.twilio.com/docs/whatsapp/tutorial/connect-number-business-profile"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    {environment === 'sandbox' ? 'Open Sandbox' : 'Register Number'}
                    <HiOutlineExternalLink className="w-4 h-4" />
                  </a>
                </div>
                {environment === 'sandbox' ? (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-300 flex items-start gap-2">
                      <HiOutlineInformationCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>In the sandbox, you'll need to send a join code (like "join [code]") to the sandbox number before testing. The sandbox number is usually <strong>+1 415 523 8886</strong>.</span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-xs text-amber-300 flex items-start gap-2">
                        <HiOutlineInformationCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span><strong>Production approval takes 2-3 business days.</strong> You'll need to provide business details and display name.</span>
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-300 flex items-start gap-2">
                        <HiOutlinePhone className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>You can use a phone number from Twilio or bring your own existing business number.</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Configure Webhook */}
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-archi-500 to-archi-600 flex items-center justify-center shrink-0 text-base font-bold text-white shadow-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-base mb-2">Configure Webhook URL</h3>
                <p className="text-sm text-slate-400 mb-3">
                  In your Twilio Console, navigate to <strong>Messaging → Settings → WhatsApp sender</strong> and set this URL as your webhook:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-green-400 font-mono overflow-x-auto">
                      {webhookUrl}
                    </code>
                    <button
                      onClick={copyWebhookUrl}
                      className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors shrink-0"
                      title="Copy webhook URL"
                    >
                      {copied ? (
                        <HiOutlineCheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <HiOutlineClipboard className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-xs text-purple-300 flex items-start gap-2">
                      <HiOutlineInformationCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Set this URL for <strong>"When a message comes in"</strong> webhook. Make sure the HTTP method is set to <strong>POST</strong>.</span>
                    </p>
                  </div>
                  <a
                    href="https://console.twilio.com/us1/develop/sms/settings/whatsapp-sender"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-archi-400 hover:text-archi-300 transition-colors"
                  >
                    Open Twilio Webhook Settings <HiOutlineExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Step 4: Configure Environment Variables */}
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-archi-500 to-archi-600 flex items-center justify-center shrink-0 text-base font-bold text-white shadow-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-base mb-2">Set Environment Variables</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Add these variables to your hosting environment (Vercel, Heroku, etc.):
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowEnvVars(!showEnvVars)}
                    className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-slate-200">
                      {showEnvVars ? 'Hide' : 'Show'} Environment Variables
                    </span>
                    {showEnvVars ? (
                      <HiOutlineChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <HiOutlineChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  {showEnvVars && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                        <code className="block text-sm text-slate-300 font-mono whitespace-pre">
{environment === 'sandbox' 
  ? `TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886`
  : `TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=your_approved_whatsapp_number`}
                        </code>
                      </div>
                      <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-300 flex items-start gap-2">
                          <HiOutlineShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                          <span><strong>Security:</strong> Never commit these values to Git. Use your hosting platform's environment variable settings.</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 5: Enter Phone Configuration */}
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-archi-500 to-archi-600 flex items-center justify-center shrink-0 text-base font-bold text-white shadow-lg">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-base mb-2">Enter Your WhatsApp Configuration</h3>
                <p className="text-sm text-slate-400 mb-4">
                  {environment === 'sandbox'
                    ? 'For sandbox testing, use +14155238886 as your phone number.'
                    : 'Enter your approved WhatsApp Business phone number with country code.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      WhatsApp Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.phoneNumber}
                      onChange={(e) => {
                        setConfig({ ...config, phoneNumber: e.target.value });
                        setValidationErrors({ ...validationErrors, phoneNumber: undefined });
                      }}
                      placeholder={environment === 'sandbox' ? '+14155238886' : '+1234567890'}
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.phoneNumber
                          ? 'border-red-500 focus:ring-red-500/50'
                          : 'border-slate-700 focus:ring-archi-500/50'
                      }`}
                    />
                    {validationErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-4 h-4" />
                        {validationErrors.phoneNumber}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Include country code (e.g., +1 for US, +44 for UK, +27 for ZA)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Business Display Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.displayName}
                      onChange={(e) => {
                        setConfig({ ...config, displayName: e.target.value });
                        setValidationErrors({ ...validationErrors, displayName: undefined });
                      }}
                      placeholder="My Business Name"
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.displayName
                          ? 'border-red-500 focus:ring-red-500/50'
                          : 'border-slate-700 focus:ring-archi-500/50'
                      }`}
                    />
                    {validationErrors.displayName && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-4 h-4" />
                        {validationErrors.displayName}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      This name will appear in customer conversations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <HiOutlineInformationCircle className="w-5 h-5" />
              <span>Save your configuration to enable connection testing</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEnvironment(null);
                  setConfig({
                    phoneNumber: '',
                    displayName: '',
                    isActive: false,
                    verified: false,
                  });
                  setValidationErrors({});
                }}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || (!config.phoneNumber && !config.displayName)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-archi-500 hover:bg-archi-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <HiOutlineCheckCircle className="w-5 h-5" />
                    Saved Successfully!
                  </>
                ) : (
                  <>
                    <HiOutlineSave className="w-5 h-5" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Help & Resources Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-4"
      >
        {/* Quick Links */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <HiOutlineInformationCircle className="w-5 h-5 text-archi-400" />
            Helpful Resources
          </h3>
          <div className="space-y-2">
            <a
              href="https://www.twilio.com/docs/whatsapp/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <span className="text-sm text-slate-300">WhatsApp API Documentation</span>
              <HiOutlineExternalLink className="w-4 h-4 text-slate-500 group-hover:text-archi-400" />
            </a>
            <a
              href="https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <span className="text-sm text-slate-300">Message Templates Guide</span>
              <HiOutlineExternalLink className="w-4 h-4 text-slate-500 group-hover:text-archi-400" />
            </a>
            <a
              href="https://www.twilio.com/docs/whatsapp/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <span className="text-sm text-slate-300">Pricing Information</span>
              <HiOutlineExternalLink className="w-4 h-4 text-slate-500 group-hover:text-archi-400" />
            </a>
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <span className="text-sm text-slate-300">Twilio Console</span>
              <HiOutlineExternalLink className="w-4 h-4 text-slate-500 group-hover:text-archi-400" />
            </a>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-5 h-5 text-amber-400" />
            Common Issues
          </h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="font-medium text-slate-200 mb-1">Messages not being received?</p>
              <p className="text-slate-400 text-xs">
                Verify your webhook URL is correct and environment variables are set. Check Twilio logs for errors.
              </p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="font-medium text-slate-200 mb-1">Webhook returns 401/403?</p>
              <p className="text-slate-400 text-xs">
                Ensure TWILIO_AUTH_TOKEN is correctly set and matches your Twilio account credentials.
              </p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="font-medium text-slate-200 mb-1">Can't send messages in sandbox?</p>
              <p className="text-slate-400 text-xs">
                Recipients must first send the join code to your sandbox number before you can message them.
              </p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="font-medium text-slate-200 mb-1">Need production approval?</p>
              <p className="text-slate-400 text-xs">
                Submit your business profile via Twilio Console. Approval typically takes 2-3 business days.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-r from-archi-500/10 via-purple-500/10 to-blue-500/10 border border-archi-500/20 rounded-xl p-6"
      >
        <h3 className="font-semibold text-white mb-4 text-lg">What You Can Do After Setup</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <HiOutlineCheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Automated Responses</p>
              <p className="text-xs text-slate-400 mt-1">
                AI-powered replies to customer inquiries 24/7
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <HiOutlinePhone className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Conversation History</p>
              <p className="text-xs text-slate-400 mt-1">
                Track and manage all customer conversations
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <HiOutlineLightningBolt className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">RAG Knowledge Base</p>
              <p className="text-xs text-slate-400 mt-1">
                Answers based on your uploaded documents
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
