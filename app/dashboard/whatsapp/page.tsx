import { Metadata } from 'next';
import WhatsAppSetupPage from '@/app/components/dashboard/WhatsAppSetupPage';

export const metadata: Metadata = {
  title: 'WhatsApp Setup',
  description: 'Connect your WhatsApp Business number',
};

export default function WhatsAppPage() {
  return <WhatsAppSetupPage />;
}
