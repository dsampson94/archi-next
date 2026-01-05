import { Metadata } from 'next';
import WhatsAppSetupPage from '@/app/components/dashboard/WhatsAppSetupPage';

export const metadata: Metadata = {
  title: 'WhatsApp Advanced Setup',
  description: 'Connect your own WhatsApp Business number',
};

export default function WhatsAppAdvancedPage() {
  return <WhatsAppSetupPage />;
}
