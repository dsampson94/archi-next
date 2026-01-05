'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlinePlus,
  HiOutlineDotsVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineChat,
  HiOutlineExternalLink,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineBan,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  trialEndsAt?: string;
  _count: {
    users: number;
    documents: number;
    conversations: number;
    agents: number;
  };
  owner?: {
    name: string;
    email: string;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchTenants();
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
    }
    setShowDropdown(null);
  };

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchTenants();
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    }
    setShowDropdown(null);
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.owner?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPlan = planFilter === 'all' || tenant.plan.toLowerCase() === planFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'trial':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'suspended':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'churned':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'professional':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'starter':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-48 mb-2" />
            <div className="h-4 bg-slate-800 rounded w-64" />
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-slate-800 animate-pulse">
              <div className="h-6 bg-slate-800 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-slate-400 mt-1">
            Manage all {tenants.length} tenant accounts on the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTenants}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          <Link
            href="/admin/tenants/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors font-medium text-sm"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Tenant
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, slug, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="churned">Churned</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{tenants.length}</p>
          <p className="text-sm text-slate-400">Total Tenants</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">
            {tenants.filter((t) => t.status.toLowerCase() === 'active').length}
          </p>
          <p className="text-sm text-slate-400">Active</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">
            {tenants.filter((t) => t.status.toLowerCase() === 'trial').length}
          </p>
          <p className="text-sm text-slate-400">On Trial</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-400">
            {tenants.filter((t) => t.status.toLowerCase() === 'suspended').length}
          </p>
          <p className="text-sm text-slate-400">Suspended</p>
        </div>
      </div>

      {/* Tenants Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Usage
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-slate-400">No tenants found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/admin/tenants/${tenant.id}`}
                          className="font-medium text-white hover:text-amber-400 transition-colors"
                        >
                          {tenant.name}
                        </Link>
                        <p className="text-sm text-slate-500">/{tenant.slug}</p>
                        {tenant.owner && (
                          <p className="text-xs text-slate-500 mt-1">{tenant.owner.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getPlanColor(tenant.plan)}`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                      </span>
                      {tenant.trialEndsAt && tenant.status.toLowerCase() === 'trial' && (
                        <p className="text-xs text-slate-500 mt-1">
                          Ends {new Date(tenant.trialEndsAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1" title="Users">
                          <HiOutlineUserGroup className="w-4 h-4" />
                          {tenant._count.users}
                        </span>
                        <span className="flex items-center gap-1" title="Documents">
                          <HiOutlineDocumentText className="w-4 h-4" />
                          {tenant._count.documents}
                        </span>
                        <span className="flex items-center gap-1" title="Conversations">
                          <HiOutlineChat className="w-4 h-4" />
                          {tenant._count.conversations}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === tenant.id ? null : tenant.id)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <HiOutlineDotsVertical className="w-5 h-5" />
                        </button>
                        {showDropdown === tenant.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                            <Link
                              href={`/admin/tenants/${tenant.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                              View Details
                            </Link>
                            <Link
                              href={`/admin/tenants/${tenant.id}/edit`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                              Edit Tenant
                            </Link>
                            <button
                              onClick={() => {
                                // Impersonate - log in as this tenant
                                window.open(`/dashboard?impersonate=${tenant.id}`, '_blank');
                                setShowDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <HiOutlineExternalLink className="w-4 h-4" />
                              Impersonate
                            </button>
                            <div className="border-t border-slate-700" />
                            {tenant.status.toLowerCase() === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(tenant.id, 'SUSPENDED')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-slate-700 transition-colors"
                              >
                                <HiOutlineBan className="w-4 h-4" />
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(tenant.id, 'ACTIVE')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-slate-700 transition-colors"
                              >
                                <HiOutlineCheckCircle className="w-4 h-4" />
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(tenant.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                              Delete Tenant
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm">
          <HiOutlineDownload className="w-4 h-4" />
          Export to CSV
        </button>
      </div>
    </div>
  );
}
