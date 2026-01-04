import DocumentsPage from '@/app/components/dashboard/DocumentsPageNew';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents',
  description: 'Manage your knowledge base documents',
};

export default function Documents() {
  return <DocumentsPage />;
}
