'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { useState } from 'react';

// Model pricing data (with 100% markup)
const models = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', costPerMessage: 0.0014, recommended: true, description: 'Best value - fast & affordable' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', costPerMessage: 0.0014, recommended: false, description: 'Legacy model, still capable' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', costPerMessage: 0.015, recommended: false, description: 'Most capable for complex tasks' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI', costPerMessage: 0.021, recommended: false, description: 'High intelligence, higher cost' },
  { id: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic', costPerMessage: 0.0008, recommended: true, description: 'Lightning fast responses' },
  { id: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic', costPerMessage: 0.0099, recommended: false, description: 'Balanced speed & intelligence' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic', costPerMessage: 0.0495, recommended: false, description: 'Most capable Claude model' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'Google', costPerMessage: 0.0002, recommended: true, description: 'Extremely fast & cheap' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google', costPerMessage: 0.0074, recommended: false, description: 'Advanced reasoning' },
  { id: 'mistral-small', label: 'Mistral Small', provider: 'Mistral', costPerMessage: 0.0024, recommended: false, description: 'European AI option' },
  { id: 'mistral-large', label: 'Mistral Large', provider: 'Mistral', costPerMessage: 0.0096, recommended: false, description: 'High capability Mistral' },
  { id: 'llama-3.1-8b', label: 'Llama 3.1 8B', provider: 'Groq', costPerMessage: 0.00004, recommended: true, description: 'Ultra-low cost option' },
  { id: 'llama-3.1-70b', label: 'Llama 3.1 70B', provider: 'Groq', costPerMessage: 0.0004, recommended: false, description: 'Open-source powerhouse' },
];

const USD_TO_ZAR = 18.5;

function formatZAR(usd: number): string {
  const zar = usd * USD_TO_ZAR;
  if (zar < 0.01) return `R${zar.toFixed(4)}`;
  if (zar < 0.1) return `R${zar.toFixed(3)}`;
  return `R${zar.toFixed(2)}`;
}

function formatUSD(usd: number): string {
  if (usd < 0.001) return `$${usd.toFixed(5)}`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

export default function PricingPage() {
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');
  const [messageCount, setMessageCount] = useState(1000);

  const formatPrice = currency === 'ZAR' ? formatZAR : formatUSD;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-archi-400 to-archi-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-semibold">Archi</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-archi-400 font-medium">Pricing</Link>
              <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</Link>
              <Link href="/auth" className="px-4 py-2 text-sm font-medium bg-archi-500 hover:bg-archi-400 rounded-lg transition-all">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold"
          >
            Simple{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-archi-400 to-archi-300">
              Per-Message
            </span>{' '}
            Pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-400"
          >
            No subscriptions. No hidden fees. Pay only for the messages your bots process.
          </motion.p>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
            <div className="grid sm:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">1️⃣</div>
                <h4 className="font-medium">Sign Up Free</h4>
                <p className="text-sm text-slate-400 mt-1">Get $5 in credits</p>
              </div>
              <div>
                <div className="text-3xl mb-2">2️⃣</div>
                <h4 className="font-medium">Create a Bot</h4>
                <p className="text-sm text-slate-400 mt-1">Choose your AI model</p>
              </div>
              <div>
                <div className="text-3xl mb-2">3️⃣</div>
                <h4 className="font-medium">Upload Docs</h4>
                <p className="text-sm text-slate-400 mt-1">Train your bot</p>
              </div>
              <div>
                <div className="text-3xl mb-2">4️⃣</div>
                <h4 className="font-medium">Start Chatting</h4>
                <p className="text-sm text-slate-400 mt-1">Pay per message</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Currency Toggle & Calculator */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setCurrency('ZAR')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currency === 'ZAR' ? 'bg-archi-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇿🇦 ZAR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currency === 'USD' ? 'bg-archi-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇺🇸 USD
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Estimate for:</span>
              <select
                value={messageCount}
                onChange={(e) => setMessageCount(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value={100}>100 messages</option>
                <option value={500}>500 messages</option>
                <option value={1000}>1,000 messages</option>
                <option value={5000}>5,000 messages</option>
                <option value={10000}>10,000 messages</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Model Pricing Table */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Your AI Model</h2>
          
          {/* Recommended Models */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-archi-400 mb-4 flex items-center gap-2">
              <HiOutlineCheck className="w-5 h-5" /> Recommended for Most Users
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {models.filter(m => m.recommended).map((model) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-5 rounded-xl bg-archi-500/10 border border-archi-500/30 hover:border-archi-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">{model.provider}</span>
                  </div>
                  <h4 className="font-semibold">{model.label}</h4>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-archi-400">
                      {formatPrice(model.costPerMessage)}
                    </span>
                    <span className="text-slate-400 text-sm">/msg</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{model.description}</p>
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500">
                      {messageCount.toLocaleString()} msgs ≈ {formatPrice(model.costPerMessage * messageCount)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* All Models Table */}
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-300">Model</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-300">Provider</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-300">Per Message</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-300">{messageCount.toLocaleString()} Messages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {models.sort((a, b) => a.costPerMessage - b.costPerMessage).map((model) => (
                  <tr key={model.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.label}</span>
                        {model.recommended && (
                          <span className="px-2 py-0.5 text-xs bg-archi-500/20 text-archi-400 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{model.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{model.provider}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-archi-400">{formatPrice(model.costPerMessage)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono">{formatPrice(model.costPerMessage * messageCount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Note */}
          <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-start gap-3">
              <HiOutlineQuestionMarkCircle className="w-5 h-5 text-archi-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1">How is pricing calculated?</p>
                <p>
                  Each message is charged based on the tokens used (input + output). The prices shown above are 
                  estimates based on typical WhatsApp conversations (~150 tokens input, ~300 tokens output per message).
                  Actual costs may vary based on message length and context.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Everything Included</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Unlimited workspaces',
              'Unlimited bots',
              'Unlimited document uploads',
              'WhatsApp integration',
              'Analytics dashboard',
              'Human handoff',
              'API access',
              'Voice notes support',
              'Source citations',
              'Multi-language support',
              'Team collaboration',
              'Email support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                <HiOutlineCheck className="w-5 h-5 text-archi-400 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Start with $5 Free Credits
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            No credit card required. Start building your AI assistant today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth?tab=register"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium bg-archi-500 hover:bg-archi-400 text-white rounded-xl transition-all shadow-lg shadow-archi-500/25"
            >
              Create Free Account
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium border border-slate-700 hover:border-slate-600 text-white rounded-xl transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Archi. Built in South Africa 🇿🇦
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
