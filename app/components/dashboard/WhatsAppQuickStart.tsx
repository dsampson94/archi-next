'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineCheckCircle,
  HiOutlineClipboard,
  HiOutlineExternalLink,
  HiOutlineQrcode,
  HiOutlineChat,
  HiOutlineLightningBolt,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

// Sandbox WhatsApp number (Twilio sandbox)
const SANDBOX_NUMBER = '+14155238886';
const SANDBOX_JOIN_CODE = 'join purple-sky'; // Example join code

interface Agent {
  id: string;
  name: string;
  model: string;
}

export default function WhatsAppQuickStart() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        if (data.agents?.length > 0) {
          setSelectedAgent(data.agents[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const whatsappLink = `https://wa.me/${SANDBOX_NUMBER.replace('+', '')}?text=${encodeURIComponent(SANDBOX_JOIN_CODE)}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-archi-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No agents created yet
  if (agents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <HiOutlineInformationCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Create a Bot First</h2>
          <p className="text-slate-400 mb-6">
            You need to create an AI bot before you can connect it to WhatsApp.
          </p>
          <Link
            href="/dashboard/agents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-archi-500 hover:bg-archi-400 text-white rounded-xl font-medium transition-all"
          >
            <HiOutlineLightningBolt className="w-5 h-5" />
            Create Your First Bot
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <FaWhatsapp className="w-7 h-7 text-white" />
            </div>
            Chat on WhatsApp
          </h1>
          <p className="text-slate-400 mt-2">
            Start chatting with your AI bot on WhatsApp in 2 minutes
          </p>
        </div>
      </div>

      {/* Select Bot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-slate-900/50 border border-slate-800"
      >
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-archi-500 text-white text-sm flex items-center justify-center font-bold">1</span>
          Select Your Bot
        </h2>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-archi-500/50"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.model})
            </option>
          ))}
        </select>
      </motion.div>

      {/* Quick Start - Sandbox */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30"
      >
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">2</span>
          Start Chatting (Free Sandbox)
        </h2>
        
        <p className="text-slate-300 mb-6">
          Click the button below to open WhatsApp and start testing your bot immediately. 
          This uses Twilio's free sandbox - no setup required!
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all text-lg shadow-lg shadow-green-500/25"
          >
            <FaWhatsapp className="w-6 h-6" />
            Open WhatsApp Chat
            <HiOutlineExternalLink className="w-5 h-5" />
          </a>
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Or scan this QR code:</h4>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center">
              {/* Simple QR placeholder - in production use a QR library */}
              <div className="text-center">
                <HiOutlineQrcode className="w-16 h-16 text-slate-800 mx-auto" />
                <span className="text-xs text-slate-600">Scan to chat</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-2">
                <strong className="text-white">Sandbox Number:</strong>
              </p>
              <div className="flex items-center gap-2 mb-3">
                <code className="px-3 py-1.5 bg-slate-900 rounded text-green-400 font-mono text-sm">
                  {SANDBOX_NUMBER}
                </code>
                <button
                  onClick={() => copyToClipboard(SANDBOX_NUMBER, 'number')}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                >
                  {copied === 'number' ? (
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <HiOutlineClipboard className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-2">
                <strong className="text-white">Send this message first:</strong>
              </p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 bg-slate-900 rounded text-amber-400 font-mono text-sm">
                  {SANDBOX_JOIN_CODE}
                </code>
                <button
                  onClick={() => copyToClipboard(SANDBOX_JOIN_CODE, 'code')}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                >
                  {copied === 'code' ? (
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <HiOutlineClipboard className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300 flex items-start gap-2">
            <HiOutlineInformationCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              The sandbox is free and great for testing. For production use with your own WhatsApp Business number, 
              check out the <Link href="/dashboard/whatsapp/advanced" className="text-blue-400 underline">advanced setup guide</Link>.
            </span>
          </p>
        </div>
      </motion.div>

      {/* What Happens Next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl bg-slate-900/50 border border-slate-800"
      >
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-archi-500 text-white text-sm flex items-center justify-center font-bold">3</span>
          Start Asking Questions
        </h2>
        
        <p className="text-slate-300 mb-4">
          Once connected, you can ask your bot anything related to your uploaded documents:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <HiOutlineChat className="w-5 h-5 text-archi-400 mt-0.5" />
            <div>
              <p className="text-sm text-white">"What's our leave policy?"</p>
              <p className="text-xs text-slate-500 mt-1">Get instant answers from your HR documents</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <HiOutlineChat className="w-5 h-5 text-archi-400 mt-0.5" />
            <div>
              <p className="text-sm text-white">"How do I submit an expense claim?"</p>
              <p className="text-xs text-slate-500 mt-1">Step-by-step guidance from your policies</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <HiOutlineChat className="w-5 h-5 text-archi-400 mt-0.5" />
            <div>
              <p className="text-sm text-white">"What are the office hours?"</p>
              <p className="text-xs text-slate-500 mt-1">Quick answers with source citations</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            <strong className="text-white">Pro tip:</strong> Upload more documents to expand what your bot can answer.{' '}
            <Link href="/dashboard/documents" className="text-archi-400 hover:underline">
              Manage documents →
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Need Production? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Ready for Production?</h3>
            <p className="text-sm text-slate-400 mt-1">
              Get your own WhatsApp Business number for customer-facing bots
            </p>
          </div>
          <Link
            href="/dashboard/whatsapp/advanced"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            Advanced Setup →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
