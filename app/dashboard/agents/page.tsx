import { Metadata } from 'next';
import AgentConfigPage from '@/app/components/dashboard/AgentConfigPage';

export const metadata: Metadata = {
  title: 'Agent Configuration',
  description: 'Configure your AI assistant behavior and responses',
};

export default function AgentsPage() {
  return <AgentConfigPage />;
}
