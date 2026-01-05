'use client';

import { HiOutlineDocumentReport } from 'react-icons/hi';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-slate-400">Generate and view platform reports</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
          <HiOutlineDocumentReport className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">Coming Soon</h2>
        <p className="text-slate-400 max-w-sm mx-auto">
          Report generation features are under development. You&apos;ll be able to create custom reports on usage, revenue, and platform health.
        </p>
      </div>
    </div>
  );
}
