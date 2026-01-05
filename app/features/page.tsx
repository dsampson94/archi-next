'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineChat,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineGlobeAlt,
  HiOutlineCode,
  HiOutlineDatabase,
  HiOutlineCog,
  HiOutlineRefresh,
  HiOutlineCheck,
} from 'react-icons/hi';
import { FaWhatsapp, FaRobot, FaBrain } from 'react-icons/fa';

export default function FeaturesPage() {
  const features = [
    {
      icon: FaWhatsapp,
      title: 'WhatsApp Native',
      description: 'Deploy your AI assistant directly on WhatsApp. Your team and customers use what they already know.',
      details: [
        'No new apps to download',
        'Works on any device',
        'Voice notes supported',
        'Group chat compatible',
      ],
    },
    {
      icon: HiOutlineDocumentText,
      title: 'Document Intelligence',
      description: 'Upload any document and watch Archi learn. PDFs, Word, Excel, and even web pages.',
      details: [
        'PDF, DOCX, XLSX, TXT support',
        'Automatic text extraction',
        'Smart chunking & indexing',
        'Source citation in responses',
      ],
    },
    {
      icon: FaBrain,
      title: 'Multi-Model AI',
      description: 'Choose from GPT-4, Claude, Gemini, Mistral, and Llama. Pick the perfect model for your use case.',
      details: [
        '13+ AI models available',
        'Switch models anytime',
        'Transparent per-message pricing',
        'No vendor lock-in',
      ],
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Trusted Answers',
      description: 'Every response cites its source. Confidence gates prevent hallucinations and misinformation.',
      details: [
        'Source citations on every answer',
        'Confidence scoring',
        'Fallback to human when unsure',
        'Full audit trail',
      ],
    },
    {
      icon: HiOutlineChartBar,
      title: 'Analytics Dashboard',
      description: 'Understand what your users are asking. Find knowledge gaps and improve continuously.',
      details: [
        'Top questions tracking',
        'Response quality metrics',
        'Usage patterns & trends',
        'Cost analytics per model',
      ],
    },
    {
      icon: HiOutlineUserGroup,
      title: 'Human Handoff',
      description: 'When AI reaches its limits, seamlessly escalate to a human with full context preserved.',
      details: [
        'Smart escalation triggers',
        'Context preservation',
        'Agent assignment rules',
        'SLA tracking',
      ],
    },
    {
      icon: HiOutlineGlobeAlt,
      title: 'Multi-Workspace',
      description: 'Manage multiple businesses or departments from a single account. Perfect for agencies.',
      details: [
        'Unlimited workspaces',
        'Separate knowledge bases',
        'Individual billing per workspace',
        'Team access controls',
      ],
    },
    {
      icon: FaRobot,
      title: 'Multiple Bots',
      description: 'Create specialized bots for different use cases. HR bot, IT helpdesk, customer support, and more.',
      details: [
        'Unlimited bots per workspace',
        'Custom personality per bot',
        'Different models per bot',
        'Separate knowledge bases',
      ],
    },
    {
      icon: HiOutlineCode,
      title: 'API Access',
      description: 'Integrate Archi into your existing systems. REST API for custom implementations.',
      details: [
        'RESTful API endpoints',
        'Webhook integrations',
        'Custom UI embedding',
        'Developer documentation',
      ],
    },
    {
      icon: HiOutlineDatabase,
      title: 'Knowledge Base',
      description: 'Build a living knowledge base that grows with your organization.',
      details: [
        'Vector-powered search',
        'Automatic updates',
        'Version history',
        'Import/export tools',
      ],
    },
    {
      icon: HiOutlineLightningBolt,
      title: 'Voice Notes',
      description: 'Send voice messages, get voice or text replies. Perfect for field teams.',
      details: [
        'Automatic transcription',
        'Voice response option',
        'Multiple languages',
        'Noise cancellation',
      ],
    },
    {
      icon: HiOutlineCog,
      title: 'Customization',
      description: 'Customize bot personality, response style, and behavior to match your brand.',
      details: [
        'Custom system prompts',
        'Response formatting',
        'Brand voice training',
        'Multi-language support',
      ],
    },
  ];

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
              <Link href="/features" className="text-sm text-archi-400 font-medium">Features</Link>
              <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
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
            Everything You Need for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-archi-400 to-archi-300">
              AI-Powered Knowledge
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-400"
          >
            Built for real businesses. Deployed on WhatsApp. Powered by the best AI models.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-archi-500/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-archi-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-archi-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-slate-300">
                      <HiOutlineCheck className="w-4 h-4 text-archi-400 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Sign up today and get $5 in free credits. No credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth?tab=register"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium bg-archi-500 hover:bg-archi-400 text-white rounded-xl transition-all shadow-lg shadow-archi-500/25"
            >
              Create Free Account
            </Link>
            <Link 
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium border border-slate-700 hover:border-slate-600 text-white rounded-xl transition-all"
            >
              View Pricing
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
