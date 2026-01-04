'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCog,
  HiOutlineOfficeBuilding,
  HiOutlineCreditCard,
  HiOutlineBell,
  HiOutlineColorSwatch,
  HiOutlineTrash,
  HiOutlineCheck,
} from 'react-icons/hi';

interface TenantSettings {
  name: string;
  subdomain: string;
  timezone: string;
  billingEmail: string;
  notifications: {
    emailOnHandoff: boolean;
    emailDailyDigest: boolean;
    emailWeeklyReport: boolean;
  };
  branding: {
    primaryColor: string;
    welcomeMessage: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    subdomain: '',
    timezone: 'Africa/Johannesburg',
    billingEmail: '',
    notifications: {
      emailOnHandoff: true,
      emailDailyDigest: false,
      emailWeeklyReport: true,
    },
    branding: {
      primaryColor: '#10B981',
      welcomeMessage: 'Hello! How can I help you today?',
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'branding' | 'danger'>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSavedMessage('');
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        setSavedMessage('Settings saved successfully!');
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: HiOutlineOfficeBuilding },
    { id: 'notifications', label: 'Notifications', icon: HiOutlineBell },
    { id: 'branding', label: 'Branding', icon: HiOutlineColorSwatch },
    { id: 'danger', label: 'Danger Zone', icon: HiOutlineTrash },
  ] as const;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
          <div className="h-10 bg-slate-800 rounded w-full mb-4" />
          <div className="h-10 bg-slate-800 rounded w-full mb-4" />
          <div className="h-10 bg-slate-800 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">
            Manage your workspace settings and preferences
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-archi-500 hover:bg-archi-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <HiOutlineCheck className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {savedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg"
        >
          {savedMessage}
        </motion.div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-archi-500/20 text-archi-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineOfficeBuilding className="w-5 h-5" />
                General Settings
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-archi-500"
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={settings.subdomain}
                    onChange={(e) => setSettings((s) => ({ ...s, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-archi-500"
                    placeholder="your-business"
                  />
                  <span className="px-4 py-2 bg-slate-700 border border-l-0 border-slate-700 rounded-r-lg text-slate-400">
                    .archi.chat
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-archi-500"
                >
                  <option value="Africa/Johannesburg">South Africa (SAST)</option>
                  <option value="Europe/London">UK (GMT/BST)</option>
                  <option value="America/New_York">US Eastern</option>
                  <option value="America/Los_Angeles">US Pacific</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={settings.billingEmail}
                  onChange={(e) => setSettings((s) => ({ ...s, billingEmail: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-archi-500"
                  placeholder="billing@example.com"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineBell className="w-5 h-5" />
                Notification Preferences
              </h2>

              <div className="space-y-4">
                {[
                  { key: 'emailOnHandoff', label: 'Email on handoff', desc: 'Get notified when a conversation is handed off to human support' },
                  { key: 'emailDailyDigest', label: 'Daily digest', desc: 'Receive a daily summary of AI activity and performance' },
                  { key: 'emailWeeklyReport', label: 'Weekly report', desc: 'Receive a weekly analytics report' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          notifications: {
                            ...s.notifications,
                            [item.key]: !s.notifications[item.key as keyof typeof s.notifications],
                          },
                        }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.notifications[item.key as keyof typeof settings.notifications]
                          ? 'bg-archi-500'
                          : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.notifications[item.key as keyof typeof settings.notifications]
                            ? 'translate-x-6'
                            : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'branding' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineColorSwatch className="w-5 h-5" />
                Branding
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.branding.primaryColor}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, branding: { ...s.branding, primaryColor: e.target.value } }))
                    }
                    className="w-12 h-12 rounded-lg border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.branding.primaryColor}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, branding: { ...s.branding, primaryColor: e.target.value } }))
                    }
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-archi-500"
                    placeholder="#10B981"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={settings.branding.welcomeMessage}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, branding: { ...s.branding, welcomeMessage: e.target.value } }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-archi-500 resize-none"
                  placeholder="Hello! How can I help you today?"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This message is shown when someone starts a new conversation with your AI
                </p>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm font-medium text-slate-300 mb-2">Preview</p>
                <div className="bg-slate-900 rounded-lg p-4 flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: settings.branding.primaryColor }}
                  >
                    A
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Archi AI</p>
                    <p className="text-sm text-white">{settings.branding.welcomeMessage || 'Hello!'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'danger' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-950/20 border border-red-500/30 rounded-xl p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                <HiOutlineTrash className="w-5 h-5" />
                Danger Zone
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div>
                    <p className="text-white font-medium">Delete all documents</p>
                    <p className="text-sm text-slate-400">
                      Remove all uploaded documents and their vector embeddings
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors">
                    Delete All
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div>
                    <p className="text-white font-medium">Delete all conversations</p>
                    <p className="text-sm text-slate-400">
                      Clear all conversation history
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors">
                    Delete All
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-red-500/30">
                  <div>
                    <p className="text-white font-medium">Delete account</p>
                    <p className="text-sm text-slate-400">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                ⚠️ These actions cannot be undone. Please be certain before proceeding.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
