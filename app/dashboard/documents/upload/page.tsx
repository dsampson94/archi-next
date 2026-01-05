import DocumentsPage from '@/app/components/dashboard/DocumentsPageNew';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Documents',
  description: 'Upload documents to your knowledge base',
};

export default function DocumentsUpload() {
  // Redirect to documents page which has upload functionality
  return <DocumentsPage />;
}
