'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineOfficeBuilding } from 'react-icons/hi';
import toast from 'react-hot-toast';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const success = await register(
          formData.email,
          formData.password,
          formData.name,
          formData.companyName || undefined
        );
        if (success) {
          toast.success('Account created successfully!');
          router.push('/dashboard');
        } else {
          toast.error('Registration failed. Please try again.');
        }
      } else {
        const success = await login(formData.email, formData.password);
        if (success) {
          toast.success('Welcome back!');
          router.push('/dashboard');
        } else {
          toast.error('Invalid email or password');
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-archi-400 to-archi-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">A</span>
        </div>
        <span className="text-2xl font-semibold">Archi</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-2">
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="text-slate-400 text-center mb-8">
        {isSignUp
          ? 'Start your 14-day free trial'
          : 'Sign in to access your dashboard'}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-archi-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Company Name <span className="text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-archi-500 focus:border-transparent transition-all"
                  placeholder="Acme Inc."
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-archi-500 focus:border-transparent transition-all"
              placeholder="john@company.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-archi-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        {!isSignUp && (
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-archi-400 hover:text-archi-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-archi-500 hover:bg-archi-400 disabled:bg-archi-500/50 text-white font-medium rounded-xl transition-all shadow-lg shadow-archi-500/25 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
            </>
          ) : (
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>

      {/* Toggle */}
      <div className="mt-6 text-center text-sm text-slate-400">
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setIsSignUp(false)}
              className="text-archi-400 hover:text-archi-300 font-medium transition-colors"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <button
              onClick={() => setIsSignUp(true)}
              className="text-archi-400 hover:text-archi-300 font-medium transition-colors"
            >
              Sign up free
            </button>
          </>
        )}
      </div>

      {/* Terms */}
      {isSignUp && (
        <p className="mt-6 text-xs text-slate-500 text-center">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-slate-400 hover:text-white">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-slate-400 hover:text-white">
            Privacy Policy
          </Link>
        </p>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-archi-500/30 border-t-archi-500 rounded-full animate-spin"></div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
