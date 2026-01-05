'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AgentTestPanel from '@/app/components/dashboard/AgentTestPanel';
import { HiOutlineChat, HiOutlineSelector } from 'react-icons/hi';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  isActive: boolean;
}

export default function AgentTestPage() {
  const searchParams = useSearchParams();
  const preselectedAgentId = searchParams.get('agent');
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(preselectedAgentId);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
          
          // Select first agent if none preselected
          if (!preselectedAgentId && data.agents?.length > 0) {
            setSelectedAgentId(data.agents[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [preselectedAgentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="w-8 h-8 border-2 border-archi-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-center">
        <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
          <HiOutlineChat className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">No Agents Found</h2>
        <p className="text-slate-400 max-w-sm">
          Create an agent first to test it. Go to the Bots page to create your first AI assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Agent</h1>
          <p className="text-slate-400">
            Chat with your agents to test their knowledge and responses
          </p>
        </div>

        {/* Agent Selector */}
        <div className="relative">
          <select
            value={selectedAgentId || ''}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="appearance-none w-full sm:w-64 px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-archi-500"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.model})
              </option>
            ))}
          </select>
          <HiOutlineSelector className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Test Panel */}
      {selectedAgentId && (
        <div className="h-[calc(100vh-220px)]">
          <AgentTestPanel key={selectedAgentId} agentId={selectedAgentId} />
        </div>
      )}
    </div>
  );
}
