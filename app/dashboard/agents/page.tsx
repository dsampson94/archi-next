import { Metadata } from 'next';
import AgentConfigPageNew from '@/app/components/dashboard/AgentConfigPageNew';

export const metadata: Metadata = {
  title: 'Bot Configuration',
  description: 'Create and manage multiple AI bots with different models',
};

export default function AgentsPage() {
  return <AgentConfigPageNew />;
}
