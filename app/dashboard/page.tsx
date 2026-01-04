import { Metadata } from 'next';
import DashboardOverview from '@/app/components/dashboard/DashboardOverviewNew';

export const metadata: Metadata = {
  title: 'Dashboard Overview',
  description: 'View your Archi dashboard overview',
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
