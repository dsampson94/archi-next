import { Metadata } from 'next';
import TeamPage from '@/app/components/dashboard/TeamPage';

export const metadata: Metadata = {
  title: 'Team',
  description: 'Manage your team members',
};

export default function Team() {
  return <TeamPage />;
}
