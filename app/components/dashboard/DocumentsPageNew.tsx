'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  HiOutlineX,
  HiOutlineFilter,
} from 'react-icons/hi';
import DocumentUpload from './DocumentUpload';

interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount: number;
  errorMessage?: string;
  createdAt: string;
  tags: string[];
  knowledgeBase?: { id: string; name: string };
  uploadedBy?: { id: string; name: string };
}

interface DocumentsResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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
  PENDING: {
    label: 'Pending',
    icon: HiOutlineClock,
    className: 'bg-slate-500/10 text-slate-400',
  },
  PROCESSING: {
    label: 'Processing',
    icon: HiOutlineClock,
    className: 'bg-amber-500/10 text-amber-400',
  },
  COMPLETED: {
    label: 'Processed',
    icon: HiOutlineCheckCircle,
    className: 'bg-green-500/10 text-green-400',
  },
  FAILED: {
    label: 'Failed',
    icon: HiOutlineExclamationCircle,
    className: 'bg-red-500/10 text-red-400',
  },
};

const FILE_ICONS: Record<string, string> = {
  PDF: '📄',
  DOCX: '📝',
  TXT: '📃',
  MD: '📋',
  HTML: '🌐',
  CSV: '📊',
  JSON: '🔧',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isPolling, setIsPolling] = useState(false);

  const fetchDocuments = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/documents?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data: DocumentsResponse = await response.json();
        setDocuments(data.documents);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        });
        
        // Check if any documents are still processing
        const hasProcessing = data.documents.some(
          (d) => d.status === 'PENDING' || d.status === 'PROCESSING'
        );
        setIsPolling(hasProcessing);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [pagination.page, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-refresh when documents are processing
  useEffect(() => {
    if (!isPolling) return;
    
    const interval = setInterval(() => {
      fetchDocuments(true); // Silent refresh
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [isPolling, fetchDocuments]);

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleReprocess = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Update status locally
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === documentId ? { ...d, status: 'PENDING' as const } : d
          )
        );
      }
    } catch (error) {
      console.error('Failed to reprocess document:', error);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.fileName.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Documents</h1>
            {isPolling && (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 rounded-lg">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-xs text-amber-400 font-medium">Auto-refreshing</span>
              </div>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            Manage your knowledge base documents
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors font-medium"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Upload Documents
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {['COMPLETED', 'PROCESSING', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-archi-500/20 text-archi-400 border border-archi-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {statusConfig[status as keyof typeof statusConfig].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{pagination.total}</p>
          <p className="text-sm text-slate-400">Total Documents</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">
            {documents.filter((d) => d.status === 'COMPLETED').length}
          </p>
          <p className="text-sm text-slate-400">Processed</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-amber-400">
            {documents.filter((d) => d.status === 'PROCESSING' || d.status === 'PENDING').length}
          </p>
          <p className="text-sm text-slate-400">Processing</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-400">
            {documents.filter((d) => d.status === 'FAILED').length}
          </p>
          <p className="text-sm text-slate-400">Failed</p>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-archi-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-3">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <HiOutlineDocumentText className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-white font-medium">No documents yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Upload your first document to get started
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors text-sm"
            >
              Upload Documents
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredDocuments.map((doc, index) => {
              const status = statusConfig[doc.status];
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                      {FILE_ICONS[doc.fileType] || '📄'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-white truncate">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-slate-400 truncate">
                            {doc.fileName} • {formatFileSize(doc.fileSize)}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.className}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>{formatDate(doc.createdAt)}</span>
                        {doc.chunkCount > 0 && (
                          <span>{doc.chunkCount} chunks</span>
                        )}
                        {doc.knowledgeBase && (
                          <span className="text-archi-400">{doc.knowledgeBase.name}</span>
                        )}
                      </div>

                      {/* Tags */}
                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Error Message */}
                      {doc.status === 'FAILED' && doc.errorMessage && (
                        <p className="text-xs text-red-400 mt-2">
                          Error: {doc.errorMessage}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {doc.status === 'FAILED' && (
                        <button
                          onClick={() => handleReprocess(doc.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Retry processing"
                        >
                          <HiOutlineRefresh className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="View details"
                      >
                        <HiOutlineEye className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(doc.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4 text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <HiOutlineX className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-4">
                <DocumentUpload
                  onUploadComplete={() => {
                    setShowUploadModal(false);
                    fetchDocuments();
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <HiOutlineTrash className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete Document?</h3>
                <p className="text-sm text-slate-400 mb-6">
                  This will permanently delete this document and all its processed data. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
