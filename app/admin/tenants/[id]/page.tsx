'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineChat,
  HiOutlineCog,
  HiOutlineExternalLink,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
  plan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
  maxDocuments: number;
  maxMessages: number;
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    lastLoginAt?: string;
    createdAt: string;
  }>;
  agents: Array<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
  }>;
  whatsappNumbers: Array<{
    id: string;
    phoneNumber: string;
    displayName: string;
    isActive: boolean;
  }>;
  _count: {
    users: number;
    documents: number;
    conversations: number;
    agents: number;
    knowledgeBases: number;
  };
}

interface UsageStats {
  messagesThisMonth: number;
  totalMessages: number;
  documentsSize: number;
  maxDocuments: number;
  maxMessages: number;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTenant();
  }, [params.id]);

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTenant(data.tenant);
        setUsage(data.usage);
      } else if (response.status === 404) {
        router.push('/admin/tenants');
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!tenant) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchTenant();
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    if (!confirm(`Are you sure you want to delete "${tenant.name}"? This will delete all users, documents, and conversations. This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        router.push('/admin/tenants');
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    }
  };

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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-48 mb-4" />
          <div className="h-4 bg-slate-800 rounded w-64" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Tenant not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tenants"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(tenant.status)}`}>
                {tenant.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPlanColor(tenant.plan)}`}>
                {tenant.plan}
              </span>
            </div>
            <p className="text-slate-400 mt-1">/{tenant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open(`/dashboard?impersonate=${tenant.id}`, '_blank')}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <HiOutlineExternalLink className="w-4 h-4" />
            Impersonate
          </button>
          <Link
            href={`/admin/tenants/${tenant.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <HiOutlinePencil className="w-4 h-4" />
            Edit
          </Link>
          {tenant.status.toLowerCase() === 'active' ? (
            <button
              onClick={() => handleStatusChange('SUSPENDED')}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 px-4 py-2 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <HiOutlineBan className="w-4 h-4" />
              Suspend
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 px-4 py-2 text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <HiOutlineCheckCircle className="w-4 h-4" />
              Activate
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
          >
            <HiOutlineTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HiOutlineUserGroup className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant._count.users}</p>
              <p className="text-sm text-slate-400">Users</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <HiOutlineDocumentText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant._count.documents}</p>
              <p className="text-sm text-slate-400">Documents</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <HiOutlineChat className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant._count.conversations}</p>
              <p className="text-sm text-slate-400">Conversations</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <HiOutlineCog className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant._count.agents}</p>
              <p className="text-sm text-slate-400">Agents</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <FaWhatsapp className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant.whatsappNumbers.length}</p>
              <p className="text-sm text-slate-400">WhatsApp #s</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Usage & Limits */}
      {usage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h2 className="font-semibold text-white mb-4">Usage & Limits</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Messages This Month</span>
                <span className="text-white">{usage.messagesThisMonth} / {usage.maxMessages}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min((usage.messagesThisMonth / usage.maxMessages) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Documents</span>
                <span className="text-white">{tenant._count.documents} / {usage.maxDocuments}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min((tenant._count.documents / usage.maxDocuments) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Storage Used</span>
                <span className="text-white">{formatBytes(usage.documentsSize)}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-semibold text-white">Team Members</h2>
          </div>
          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
            {tenant.users.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-white font-medium">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.role === 'OWNER' ? 'bg-amber-500/10 text-amber-400' :
                    user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                  {user.lastLoginAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tenant Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-semibold text-white">Tenant Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Created</span>
              <span className="text-white">{new Date(tenant.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Updated</span>
              <span className="text-white">{new Date(tenant.updatedAt).toLocaleDateString()}</span>
            </div>
            {tenant.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-slate-400">Trial Ends</span>
                <span className="text-white">{new Date(tenant.trialEndsAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Domain</span>
              <span className="text-white">{tenant.domain || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Primary Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-slate-600"
                  style={{ backgroundColor: tenant.primaryColor || '#14b8a6' }}
                />
                <span className="text-white">{tenant.primaryColor || '#14b8a6'}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Documents</span>
              <span className="text-white">{tenant.maxDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Messages/Month</span>
              <span className="text-white">{tenant.maxMessages}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* WhatsApp Numbers */}
      {tenant.whatsappNumbers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-semibold text-white">WhatsApp Numbers</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {tenant.whatsappNumbers.map((number) => (
              <div key={number.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FaWhatsapp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{number.displayName}</p>
                    <p className="text-sm text-slate-400">{number.phoneNumber}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  number.isActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {number.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
