import Link from 'next/link';
import { HiOutlineDocumentSearch, HiOutlineHome } from 'react-icons/hi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-archi-500/10 flex items-center justify-center mx-auto mb-6">
          <HiOutlineDocumentSearch className="w-8 h-8 text-archi-400" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors font-medium"
        >
          <HiOutlineHome className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
