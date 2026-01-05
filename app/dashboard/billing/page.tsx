import { Metadata } from 'next';
import BillingPage from '@/app/components/dashboard/BillingPage';

export const metadata: Metadata = {
  title: 'Billing & Tokens',
  description: 'Manage your token balance and purchase more tokens',
};

export default function BillingRoute() {
  return <BillingPage />;
}
