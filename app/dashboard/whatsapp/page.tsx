import { Metadata } from 'next';
import WhatsAppQuickStart from '@/app/components/dashboard/WhatsAppQuickStart';

export const metadata: Metadata = {
  title: 'WhatsApp Chat',
  description: 'Chat with your AI bot on WhatsApp',
};

export default function WhatsAppPage() {
  return <WhatsAppQuickStart />;
}
