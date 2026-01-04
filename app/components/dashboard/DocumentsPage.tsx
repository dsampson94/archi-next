'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineDocumentText,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineDotsVertical,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

// Mock documents data
const mockDocuments = [
  {
    id: '1',
    title: 'HR Policy Manual 2026',
    fileName: 'hr-policy-2026.pdf',
    fileType: 'PDF',
    fileSize: 2450000,
    status: 'COMPLETED',
    chunkCount: 45,
    createdAt: '2026-01-01T10:00:00Z',
    tags: ['HR', 'Policy', 'Onboarding'],
  },
  {
    id: '2',
    title: 'Leave Application Process',
    fileName: 'leave-process.docx',
    fileType: 'DOCX',
    fileSize: 540000,
    status: 'COMPLETED',
    chunkCount: 12,
    createdAt: '2026-01-01T09:00:00Z',
    tags: ['HR', 'Leave'],
  },
  {
    id: '3',
    title: 'IT Support FAQ',
    fileName: 'it-faq.pdf',
    fileType: 'PDF',
    fileSize: 890000,
    status: 'PROCESSING',
    chunkCount: 0,
    createdAt: '2026-01-01T11:00:00Z',
    tags: ['IT', 'Support'],
  },
  {
    id: '4',
    title: 'Expense Claim Procedure',
    fileName: 'expense-claims.pdf',
    fileType: 'PDF',
    fileSize: 1200000,
    status: 'COMPLETED',
    chunkCount: 18,
    createdAt: '2025-12-28T14:00:00Z',
    tags: ['Finance', 'Expenses'],
  },
  {
    id: '5',
    title: 'Company Code of Conduct',
    fileName: 'code-of-conduct.pdf',
    fileType: 'PDF',
    fileSize: 3100000,
    status: 'FAILED',
    chunkCount: 0,
    errorMessage: 'Failed to parse PDF',
    createdAt: '2025-12-27T16:00:00Z',
    tags: ['Compliance'],
  },
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const statusConfig = {
  COMPLETED: {
    label: 'Processed',
    icon: HiOutlineCheckCircle,
    className: 'bg-green-500/10 text-green-400',
  },
  PROCESSING: {
    label: 'Processing',
    icon: HiOutlineClock,
    className: 'bg-amber-500/10 text-amber-400',
  },
  PENDING: {
    label: 'Pending',
    icon: HiOutlineClock,
    className: 'bg-slate-500/10 text-slate-400',
  },
  FAILED: {
    label: 'Failed',
    icon: HiOutlineExclamationCircle,
    className: 'bg-red-500/10 text-red-400',
  },
};

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const filteredDocuments = mockDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 mt-1">Manage your knowledge base documents</p>
        </div>
        <Link
          href="/dashboard/documents/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Upload Document
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-archi-500 focus:border-transparent"
          />
        </div>
        <select className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-archi-500">
          <option value="">All Status</option>
          <option value="COMPLETED">Processed</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{mockDocuments.length}</p>
          <p className="text-sm text-slate-400">Total Documents</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">
            {mockDocuments.filter((d) => d.status === 'COMPLETED').length}
          </p>
          <p className="text-sm text-slate-400">Processed</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-amber-400">
            {mockDocuments.filter((d) => d.status === 'PROCESSING').length}
          </p>
          <p className="text-sm text-slate-400">Processing</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">
            {mockDocuments.reduce((acc, d) => acc + d.chunkCount, 0)}
          </p>
          <p className="text-sm text-slate-400">Total Chunks</p>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Chunks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Added
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredDocuments.map((doc, index) => {
                const status = statusConfig[doc.status as keyof typeof statusConfig];
                return (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center flex-shrink-0">
                          <HiOutlineDocumentText className="w-5 h-5 text-archi-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{doc.title}</p>
                          <p className="text-sm text-slate-500 truncate">{doc.fileName}</p>
                          <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.className}`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400 hidden md:table-cell">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400 hidden lg:table-cell">
                      {doc.chunkCount > 0 ? doc.chunkCount : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400 hidden lg:table-cell">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        {doc.status === 'FAILED' && (
                          <button className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-colors">
                            <HiOutlineRefresh className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="py-12 text-center">
            <HiOutlineDocumentText className="w-12 h-12 mx-auto text-slate-600" />
            <p className="mt-4 text-slate-400">No documents found</p>
            <Link
              href="/dashboard/documents/upload"
              className="inline-flex items-center gap-2 mt-4 text-archi-400 hover:text-archi-300"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Upload your first document
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
