'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HiOutlineArrowLeft,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
} from 'react-icons/hi';

export default function NewTenantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'STARTER',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
  });

  const handleSlugify = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: handleSlugify(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tenant');
      }

      const data = await response.json();
      router.push(`/admin/tenants/${data.tenant.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tenants"
          className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Tenant</h1>
          <p className="text-slate-400 mt-1">Add a new business account to the platform.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Tenant Info */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <HiOutlineOfficeBuilding className="w-5 h-5 text-amber-400" />
            Business Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              required
              placeholder="Acme Property Management"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-4 py-3 bg-slate-700 border border-r-0 border-slate-600 rounded-l-lg text-slate-400">
                archi.app/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: handleSlugify(e.target.value) })}
                required
                placeholder="acme-property"
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-r-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              URL-friendly identifier. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Plan
            </label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="STARTER">Starter - R1,500/mo</option>
              <option value="PROFESSIONAL">Professional - R2,500/mo</option>
              <option value="ENTERPRISE">Enterprise - R5,000/mo</option>
            </select>
          </div>
        </div>

        {/* Owner Info */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <HiOutlineUser className="w-5 h-5 text-amber-400" />
            Account Owner
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Owner Name *
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
                placeholder="John Smith"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Owner Email *
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                required
                placeholder="john@acmeproperty.co.za"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder="Leave empty to send invite email"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              If left empty, the owner will receive an email to set their password.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/tenants"
            className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}
