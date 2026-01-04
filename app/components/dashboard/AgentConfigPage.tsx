'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCog,
  HiOutlineSparkles,
  HiOutlineSave,
  HiOutlineRefresh,
  HiOutlineInformationCircle,
  HiOutlineCheck,
} from 'react-icons/hi';

interface Agent {
  id: string;
  name: string;
  systemPrompt: string | null;
  responseRules: string | null;
  tone: string | null;
  confidenceThreshold: number;
  handoffMessage: string | null;
  greeting: string | null;
  isActive: boolean;
}

const defaultAgent: Partial<Agent> = {
  name: 'Archi Assistant',
  systemPrompt: `You are a helpful AI assistant for our company. Your role is to answer questions accurately based on the knowledge base you have been trained on.

Guidelines:
- Be friendly and professional
- If you're unsure, say so rather than making things up
- Keep responses concise but helpful
- Refer users to human support for complex issues`,
  responseRules: `- Always greet users warmly on first contact
- Provide clear, step-by-step instructions when explaining processes
- Include relevant links or references when available
- Ask for clarification if a question is ambiguous`,
  tone: 'professional_friendly',
  confidenceThreshold: 0.7,
  handoffMessage: "I'm not confident I can answer that accurately. Let me connect you with a team member who can help better.",
  greeting: "Hi there! 👋 I'm Archi, your AI assistant. How can I help you today?",
};

const toneOptions = [
  { value: 'professional_friendly', label: 'Professional & Friendly', description: 'Warm but professional tone' },
  { value: 'formal', label: 'Formal', description: 'Strictly professional and formal' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'technical', label: 'Technical', description: 'Detailed and precise' },
];

export default function AgentConfigPage() {
  const [agent, setAgent] = useState<Partial<Agent>>(defaultAgent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch('/api/agents', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.agent) {
            setAgent(data.agent);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/agents', {
        method: agent.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(agent),
      });

      if (response.ok) {
        const data = await response.json();
        setAgent(data.agent);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save agent configuration');
      }
    } catch (error) {
      setError('Failed to save agent configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setAgent(defaultAgent);
  };

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
          <h1 className="text-2xl font-bold text-white">Agent Configuration</h1>
          <p className="text-slate-400 mt-1">
            Customize how your AI assistant behaves and responds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
          >
            <HiOutlineRefresh className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <HiOutlineCheck className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <HiOutlineSave className="w-5 h-5" />
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

      <div className="grid gap-6">
        {/* Basic Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl"
        >
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center">
              <HiOutlineCog className="w-5 h-5 text-archi-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Basic Settings</h2>
              <p className="text-sm text-slate-400">General agent configuration</p>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={agent.name || ''}
                onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                placeholder="e.g., Archi Assistant"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                This name will be used when the assistant introduces itself
              </p>
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
                        ? 'bg-archi-500/10 border-archi-500/30'
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
                      agent.tone === option.value ? 'border-archi-500 bg-archi-500' : 'border-slate-600'
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
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Sent when someone first messages your WhatsApp number
              </p>
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
            <div className="w-10 h-10 rounded-lg bg-archi-500/10 flex items-center justify-center">
              <HiOutlineSparkles className="w-5 h-5 text-archi-400" />
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
                <span className="ml-2 text-xs text-slate-500 font-normal">
                  (Instructions for how the AI should behave)
                </span>
              </label>
              <textarea
                value={agent.systemPrompt || ''}
                onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
                rows={6}
                placeholder="Describe how your AI assistant should behave..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500 resize-none font-mono text-sm"
              />
            </div>

            {/* Response Rules */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Response Rules
                <span className="ml-2 text-xs text-slate-500 font-normal">
                  (Specific guidelines for responses)
                </span>
              </label>
              <textarea
                value={agent.responseRules || ''}
                onChange={(e) => setAgent({ ...agent, responseRules: e.target.value })}
                rows={5}
                placeholder="List specific rules for how responses should be formatted..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500 resize-none font-mono text-sm"
              />
            </div>

            {/* Confidence Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white flex items-center gap-2">
                  Confidence Threshold
                  <span className="group relative">
                    <HiOutlineInformationCircle className="w-4 h-4 text-slate-500" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      When the AI's confidence falls below this threshold, it will hand off to a human agent
                    </span>
                  </span>
                </label>
                <span className="text-sm font-medium text-archi-400">
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
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-archi-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>More answers (may be less accurate)</span>
                <span>Fewer answers (more accurate)</span>
              </div>
            </div>

            {/* Handoff Message */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Handoff Message
                <span className="ml-2 text-xs text-slate-500 font-normal">
                  (Shown when transferring to a human)
                </span>
              </label>
              <textarea
                value={agent.handoffMessage || ''}
                onChange={(e) => setAgent({ ...agent, handoffMessage: e.target.value })}
                rows={2}
                placeholder="Message shown when the AI can't answer..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500 resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-archi-500/5 border border-archi-500/20 rounded-xl p-5"
        >
          <h3 className="font-semibold text-white mb-3">Preview</h3>
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-archi-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <div className="bg-slate-800 rounded-lg rounded-tl-none px-4 py-3 text-sm text-white">
                {agent.greeting || 'Hi there! How can I help you today?'}
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              This is how your assistant will greet new users
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
