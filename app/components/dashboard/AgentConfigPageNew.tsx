'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineSave,
  HiOutlineCog,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineInformationCircle,
  HiOutlineLightningBolt,
  HiOutlineChat,
  HiOutlineSparkles,
  HiOutlineChip,
} from 'react-icons/hi';
import { FaRobot } from 'react-icons/fa';

// Icon aliases for cleaner JSX
const Check = HiOutlineCheck;
const Save = HiOutlineSave;
const Bot = FaRobot;
const Plus = HiOutlinePlus;
const Settings = HiOutlineCog;
const Sparkles = HiOutlineSparkles;
const Info = HiOutlineInformationCircle;
const Cpu = HiOutlineChip;
const ChevronDown = HiOutlineChevronDown;
const Zap = HiOutlineLightningBolt;
const MessageSquare = HiOutlineChat;

interface Agent {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  responseRules: string | null;
  tone: string | null;
  temperature: number;
  provider: string;
  model: string;
  maxTokens: number;
  confidenceThreshold: number;
  handoffMessage: string | null;
  greeting: string | null;
  greetingMessage: string | null;
  isActive: boolean;
  _count?: {
    conversations: number;
  };
}

interface AvailableModel {
  id: string;
  label: string;
  provider: string;
  inputCost: number;
  outputCost: number;
}

const defaultAgent: Partial<Agent> = {
  name: 'New Bot',
  description: '',
  systemPrompt: `You are a helpful AI assistant. Your role is to answer questions accurately based on the knowledge base you have been trained on.

Guidelines:
- Be friendly and professional
- If you're unsure, say so rather than making things up
- Keep responses concise but helpful
- Refer users to human support for complex issues`,
  responseRules: `- Always greet users warmly on first contact
- Provide clear, step-by-step instructions when explaining processes
- Ask for clarification if a question is ambiguous`,
  tone: 'professional',
  temperature: 0.7,
  provider: 'OPENAI',
  model: 'gpt-4o-mini',
  maxTokens: 1024,
  confidenceThreshold: 0.7,
  handoffMessage: "I'm not confident I can answer that accurately. Let me connect you with a team member who can help better.",
  greeting: "Hi there! 👋 I'm your AI assistant. How can I help you today?",
  isActive: true,
};

const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Warm but professional tone' },
  { value: 'formal', label: 'Formal', description: 'Strictly professional and formal' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'technical', label: 'Technical', description: 'Detailed and precise' },
];

const providerColors: Record<string, string> = {
  OPENAI: 'bg-green-500/20 text-green-400 border-green-500/30',
  ANTHROPIC: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  GOOGLE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MISTRAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  GROQ: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AgentConfigPageNew() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agent, setAgent] = useState<Partial<Agent>>(defaultAgent);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        setAvailableModels(data.availableModels || []);
        
        // Select first agent by default
        if (data.agents?.length > 0 && !selectedAgentId) {
          setSelectedAgentId(data.agents[0].id);
          setAgent(data.agents[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAgent = (agentData: Agent) => {
    setSelectedAgentId(agentData.id);
    setAgent(agentData);
    setError(null);
    setSaveSuccess(false);
  };

  const handleCreateNew = () => {
    setSelectedAgentId(null);
    setAgent({ ...defaultAgent, name: `Bot ${agents.length + 1}` });
    setError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const isNew = !selectedAgentId;
      const response = await fetch('/api/agents', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isNew ? agent : { ...agent, id: selectedAgentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        
        // Refresh agents list
        await fetchAgents();
        
        // Select the saved agent
        if (isNew && data.agent) {
          setSelectedAgentId(data.agent.id);
          setAgent(data.agent);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save agent configuration');
      }
    } catch {
      setError('Failed to save agent configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgentId || agents.length <= 1) return;
    
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agents?id=${selectedAgentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchAgents();
        // Select first remaining agent
        const remaining = agents.filter(a => a.id !== selectedAgentId);
        if (remaining.length > 0) {
          handleSelectAgent(remaining[0]);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete agent');
      }
    } catch {
      setError('Failed to delete agent');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedModel = availableModels.find(m => m.id === agent.model);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Configuration</h1>
          <p className="text-slate-400 mt-1">
            Create and manage multiple AI bots for different purposes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedAgentId && agents.length > 1 && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Agent Selector */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            Your Bots ({agents.length})
          </h2>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Bot
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => handleSelectAgent(a)}
              className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
                selectedAgentId === a.id
                  ? 'bg-blue-500/20 border-blue-500/50 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span className="font-medium">{a.name}</span>
                {a.isActive && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className={`px-1.5 py-0.5 rounded ${providerColors[a.provider] || 'bg-slate-700 text-slate-400'}`}>
                  {a.provider}
                </span>
                <span>{a._count?.conversations || 0} chats</span>
              </div>
            </button>
          ))}
          
          {/* New Bot Card */}
          {!selectedAgentId && (
            <div className="flex-shrink-0 px-4 py-3 rounded-lg border border-dashed border-blue-500/50 bg-blue-500/10 text-blue-400">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="font-medium">New Bot</span>
              </div>
              <p className="text-xs text-blue-400/70 mt-1">Unsaved</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl"
          >
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Basic Settings</h2>
                <p className="text-sm text-slate-400">General bot configuration</p>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {/* Bot Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={agent.name || ''}
                  onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                  placeholder="e.g., Sales Assistant"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={agent.description || ''}
                  onChange={(e) => setAgent({ ...agent, description: e.target.value })}
                  placeholder="e.g., Handles product inquiries and orders"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Response Tone
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {toneOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        agent.tone === option.value
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={option.value}
                        checked={agent.tone === option.value}
                        onChange={(e) => setAgent({ ...agent, tone: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        agent.tone === option.value ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                      }`}>
                        {agent.tone === option.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{option.label}</p>
                        <p className="text-xs text-slate-400">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Greeting */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Greeting Message
                </label>
                <input
                  type="text"
                  value={agent.greeting || ''}
                  onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
                  placeholder="e.g., Hi there! How can I help you today?"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Active</p>
                  <p className="text-sm text-slate-400">Enable this bot to respond to messages</p>
                </div>
                <button
                  onClick={() => setAgent({ ...agent, isActive: !agent.isActive })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    agent.isActive ? 'bg-green-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    agent.isActive ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* AI Behavior */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl"
          >
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">AI Behavior</h2>
                <p className="text-sm text-slate-400">Control how the AI responds</p>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  System Prompt
                </label>
                <textarea
                  value={agent.systemPrompt || ''}
                  onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
                  rows={6}
                  placeholder="Describe how your AI assistant should behave..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                />
              </div>

              {/* Response Rules */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Response Rules
                </label>
                <textarea
                  value={agent.responseRules || ''}
                  onChange={(e) => setAgent({ ...agent, responseRules: e.target.value })}
                  rows={4}
                  placeholder="List specific rules for how responses should be formatted..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                />
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">
                    Creativity (Temperature)
                  </label>
                  <span className="text-sm font-medium text-blue-400">
                    {(agent.temperature || 0.7).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agent.temperature || 0.7}
                  onChange={(e) => setAgent({ ...agent, temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>More focused</span>
                  <span>More creative</span>
                </div>
              </div>

              {/* Confidence Threshold */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    Confidence Threshold
                    <span className="group relative">
                      <Info className="w-4 h-4 text-slate-500" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        When the AI's confidence falls below this threshold, it will hand off to a human agent
                      </span>
                    </span>
                  </label>
                  <span className="text-sm font-medium text-blue-400">
                    {Math.round((agent.confidenceThreshold || 0.7) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={agent.confidenceThreshold || 0.7}
                  onChange={(e) => setAgent({ ...agent, confidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                />
              </div>

              {/* Handoff Message */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Handoff Message
                </label>
                <textarea
                  value={agent.handoffMessage || ''}
                  onChange={(e) => setAgent({ ...agent, handoffMessage: e.target.value })}
                  rows={2}
                  placeholder="Message shown when the AI can't answer..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Model Selection Sidebar */}
        <div className="space-y-6">
          {/* Model Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl"
          >
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">AI Model</h2>
                <p className="text-sm text-slate-400">Select the LLM provider</p>
              </div>
            </div>
            <div className="p-5">
              {/* Model Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded ${providerColors[selectedModel?.provider || 'OPENAI'] || 'bg-slate-700'}`}>
                      {selectedModel?.provider || 'OPENAI'}
                    </span>
                    <span className="font-medium">{selectedModel?.label || agent.model}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModelDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 max-h-80 overflow-y-auto">
                    {availableModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setAgent({ ...agent, model: model.id, provider: model.provider });
                          setShowModelDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors ${
                          agent.model === model.id ? 'bg-blue-500/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded ${providerColors[model.provider] || 'bg-slate-700'}`}>
                            {model.provider}
                          </span>
                          <span className="font-medium text-white">{model.label}</span>
                        </div>
                        {agent.model === model.id && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Model Info */}
              {selectedModel && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Input Cost
                    </span>
                    <span className="text-white">{selectedModel.inputCost} tokens/1K</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Output Cost
                    </span>
                    <span className="text-white">{selectedModel.outputCost} tokens/1K</span>
                  </div>
                </div>
              )}

              {/* Max Tokens */}
              <div className="mt-5">
                <label className="block text-sm font-medium text-white mb-2">
                  Max Response Tokens
                </label>
                <input
                  type="number"
                  value={agent.maxTokens || 1024}
                  onChange={(e) => setAgent({ ...agent, maxTokens: parseInt(e.target.value) || 1024 })}
                  min={256}
                  max={4096}
                  step={256}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Maximum tokens per response (256-4096)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5"
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Preview
            </h3>
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-slate-800 rounded-lg rounded-tl-none px-4 py-3 text-sm text-white">
                  {agent.greeting || 'Hi there! How can I help you today?'}
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                This is how {agent.name || 'your bot'} will greet users
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
