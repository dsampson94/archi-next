'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCloudUpload,
  HiOutlineDocument,
  HiOutlineDocumentText,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

interface FileWithPreview extends File {
  preview?: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: () => void;
  knowledgeBaseId?: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/html': ['.html'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
};

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  txt: '📃',
  md: '📋',
  html: '🌐',
  csv: '📊',
  json: '🔧',
};

export default function DocumentUpload({ onUploadComplete, knowledgeBaseId }: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => 
      Object.assign(file, { status: 'pending' as const, progress: 0 })
    );
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    let hasAnySuccess = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.status === 'success') continue;

      // Update status to uploading
      setFiles((prev) => 
        prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' as const, progress: 0 } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        if (knowledgeBaseId) {
          formData.append('knowledgeBaseId', knowledgeBaseId);
        }

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        hasAnySuccess = true;

        // Update status to success
        setFiles((prev) => 
          prev.map((f, idx) => 
            idx === i ? { ...f, status: 'success' as const, progress: 100 } : f
          )
        );
      } catch (error) {
        // Update status to error
        setFiles((prev) => 
          prev.map((f, idx) => 
            idx === i ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Upload failed' 
            } : f
          )
        );
      }
    }

    setIsUploading(false);
    
    // Trigger refresh if any uploads succeeded
    if (hasAnySuccess && onUploadComplete) {
      onUploadComplete();
    }
  };

  const getFileExtension = (filename?: string) => {
    if (!filename) return '';
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-archi-500 bg-archi-500/10' 
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            ${isDragActive ? 'bg-archi-500/20' : 'bg-slate-800'}
          `}>
            <HiOutlineCloudUpload className={`w-7 h-7 ${isDragActive ? 'text-archi-400' : 'text-slate-400'}`} />
          </div>
          
          <div>
            <p className="text-white font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              or click to browse
            </p>
          </div>
          
          <p className="text-xs text-slate-500">
            PDF, DOCX, TXT, MD, HTML, CSV, JSON • Max 50MB per file
          </p>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">
                Files ({files.length})
              </h3>
              {successCount > 0 && (
                <span className="text-xs text-green-400">
                  {successCount} uploaded
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    ${file.status === 'error' ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/50'}
                  `}
                >
                  {/* File Icon */}
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg">
                    {FILE_ICONS[getFileExtension(file.name || '')] || '📄'}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name || 'Unknown file'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(file.size || 0)}
                      {file.error && (
                        <span className="text-red-400 ml-2">• {file.error}</span>
                      )}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {file.status === 'pending' && (
                      <span className="text-xs text-slate-400">Ready</span>
                    )}
                    {file.status === 'uploading' && (
                      <div className="w-5 h-5 border-2 border-archi-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {file.status === 'success' && (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <HiOutlineCheck className="w-4 h-4 text-green-400" />
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <HiOutlineExclamationCircle className="w-4 h-4 text-red-400" />
                      </div>
                    )}

                    {/* Remove Button */}
                    {file.status !== 'uploading' && file.status !== 'success' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        <HiOutlineX className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            {pendingCount > 0 && (
              <button
                onClick={uploadFiles}
                disabled={isUploading}
                className={`
                  w-full py-3 px-4 rounded-lg font-medium transition-all
                  ${isUploading
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-archi-500 hover:bg-archi-400 text-white'
                  }
                `}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`
                )}
              </button>
            )}

            {/* Clear All */}
            {successCount === files.length && files.length > 0 && (
              <button
                onClick={() => setFiles([])}
                className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
