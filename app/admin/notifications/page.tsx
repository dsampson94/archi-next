'use client';

import { HiOutlineBell } from 'react-icons/hi';

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400">Manage platform notifications and alerts</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
          <HiOutlineBell className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">Coming Soon</h2>
        <p className="text-slate-400 max-w-sm mx-auto">
          Notification management features are under development. You&apos;ll be able to send announcements and manage system alerts.
        </p>
      </div>
    </div>
  );
}
