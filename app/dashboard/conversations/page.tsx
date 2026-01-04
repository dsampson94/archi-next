import { Metadata } from 'next';
import ConversationsPage from '@/app/components/dashboard/ConversationsPage';

export const metadata: Metadata = {
  title: 'Conversations',
  description: 'View and manage WhatsApp conversations',
};

export default function Conversations() {
  return <ConversationsPage />;
}
