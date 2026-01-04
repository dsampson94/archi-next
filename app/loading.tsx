export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-archi-400 to-archi-600 animate-pulse"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-xl bg-archi-500/50 animate-ping"></div>
        </div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}
