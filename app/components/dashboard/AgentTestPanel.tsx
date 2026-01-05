'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePaperAirplane,
  HiOutlineX,
  HiOutlineChat,
  HiOutlineChip,
  HiOutlineDocumentText,
  HiOutlineRefresh,
} from 'react-icons/hi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  citations?: {
    documentTitle: string;
    snippet: string;
    score: number;
  }[];
}

interface Agent {
  id: string;
  name: string;
  model: string;
  provider: string;
  greeting?: string;
  knowledgeBaseCount: number;
}

interface AgentTestPanelProps {
  agentId: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function AgentTestPanel({ agentId, onClose, isModal = false }: AgentTestPanelProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch agent info
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`/api/agents/${agentId}/test`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setAgent(data.agent);
          
          // Add greeting if available
          if (data.agent.greeting) {
            setMessages([
              {
                id: 'greeting',
                role: 'assistant',
                content: data.agent.greeting,
                timestamp: new Date(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agent:', error);
      } finally {
        setIsLoadingAgent(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/agents/${agentId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          confidence: data.confidence,
          model: data.model,
          tokensUsed: data.tokensUsed,
          latencyMs: data.latencyMs,
          citations: data.citations,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const error = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Error: ${error.error || 'Failed to get response'}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Failed to connect to the agent. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages(
      agent?.greeting
        ? [
            {
              id: 'greeting',
              role: 'assistant',
              content: agent.greeting,
              timestamp: new Date(),
            },
          ]
        : []
    );
  };

  const panelContent = (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-archi-400 to-archi-600 flex items-center justify-center">
            <HiOutlineChat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">
              {isLoadingAgent ? 'Loading...' : agent?.name || 'Test Agent'}
            </h3>
            {agent && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HiOutlineChip className="w-3 h-3" />
                <span>{agent.model}</span>
                <span>•</span>
                <HiOutlineDocumentText className="w-3 h-3" />
                <span>{agent.knowledgeBaseCount} KB{agent.knowledgeBaseCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear chat"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoadingAgent && (
          <div className="text-center text-slate-500 py-8">
            <HiOutlineChat className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start a conversation to test the agent</p>
            <p className="text-xs mt-1">Messages won&apos;t be saved</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-archi-500 text-white'
                    : 'bg-slate-800 text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Metadata for assistant messages */}
                {message.role === 'assistant' && message.confidence !== undefined && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>
                        Confidence:{' '}
                        <span
                          className={
                            message.confidence > 0.7
                              ? 'text-green-400'
                              : message.confidence > 0.5
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }
                        >
                          {(message.confidence * 100).toFixed(0)}%
                        </span>
                      </span>
                      {message.latencyMs && <span>{message.latencyMs}ms</span>}
                      {message.tokensUsed && <span>{message.tokensUsed} tokens</span>}
                    </div>

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-1">
                        <span className="text-slate-500">Sources: </span>
                        {message.citations.map((c, i) => (
                          <span key={i} className="text-archi-400">
                            {c.documentTitle}
                            {i < message.citations!.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-archi-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-archi-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-archi-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-archi-500"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-archi-500 hover:bg-archi-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <HiOutlinePaperAirplane className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg h-[600px]"
        >
          {panelContent}
        </motion.div>
      </div>
    );
  }

  return <div className="h-full">{panelContent}</div>;
}
