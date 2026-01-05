'use client';

import { HiOutlineCog } from 'react-icons/hi';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Configure platform settings</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
          <HiOutlineCog className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">Coming Soon</h2>
        <p className="text-slate-400 max-w-sm mx-auto">
          Platform settings features are under development. You&apos;ll be able to configure system-wide settings, API limits, and defaults.
        </p>
      </div>
    </div>
  );
}
