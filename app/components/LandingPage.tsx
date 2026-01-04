'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineChat, 
  HiOutlineDocumentText, 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineMenu,
  HiOutlineX
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-archi-400 to-archi-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Archi</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/features" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all">
                Features
              </Link>
              <Link href="/pricing" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all">
                Pricing
              </Link>
              <Link href="/docs" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all">
                Docs
              </Link>
              <Link href="/blog" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all">
                Blog
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/auth" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-all">
                Sign In
              </Link>
              <Link 
                href="/auth?signup=true" 
                className="px-5 py-2.5 text-sm font-medium bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-all shadow-lg shadow-archi-500/25 hover:shadow-archi-400/30"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800"
          >
            <div className="px-4 py-4 space-y-2">
              <Link href="/features" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg">Features</Link>
              <Link href="/pricing" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg">Pricing</Link>
              <Link href="/docs" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg">Docs</Link>
              <Link href="/blog" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg">Blog</Link>
              <div className="pt-4 border-t border-slate-700 space-y-2">
                <Link href="/auth" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg">Sign In</Link>
                <Link href="/auth?signup=true" className="block px-4 py-2.5 text-center bg-archi-500 hover:bg-archi-400 text-white rounded-lg font-medium">Get Started Free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-archi-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-archi-700/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-archi-500/10 text-archi-400 border border-archi-500/20">
              <FaWhatsapp className="w-4 h-4 mr-2" />
              WhatsApp-First AI Knowledge Assistant
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            Your Company's Knowledge,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-archi-400 to-archi-300">
              Accessible on WhatsApp
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Archi turns your documents, SOPs, and processes into an AI assistant your team can ask via WhatsApp. 
            <strong className="text-white"> Trusted answers. Audit trails. Human handoff.</strong>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/demo"
              className="group w-full sm:w-auto px-8 py-4 text-base font-medium bg-archi-500 hover:bg-archi-400 text-white rounded-xl transition-all shadow-lg shadow-archi-500/25 hover:shadow-archi-400/30 flex items-center justify-center gap-2"
            >
              Try Demo Free
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link 
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium border border-slate-700 hover:border-slate-600 text-white rounded-xl transition-all hover:bg-slate-800/50"
            >
              View Pricing
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <HiOutlineShieldCheck className="w-4 h-4 text-archi-500" />
              POPIA Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlineCheck className="w-4 h-4 text-archi-500" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlineLightningBolt className="w-4 h-4 text-archi-500" />
              Setup in 7 Days
            </span>
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mt-16 max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-archi-500/10">
            {/* Mock Chat Interface */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6">
              {/* Chat Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-archi-400 to-archi-600 flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <h3 className="font-medium text-white">Archi</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    Online
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="py-6 space-y-4">
                <div className="flex justify-end">
                  <div className="bg-slate-700 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm">What's our leave policy for new employees?</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="bg-gradient-to-r from-archi-700 to-archi-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm leading-relaxed">
                      Based on the HR Policy Document (Section 4.2), new employees are entitled to:
                    </p>
                    <ul className="mt-2 text-sm space-y-1 text-slate-200">
                      <li>• <strong>15 days</strong> annual leave (pro-rata first year)</li>
                      <li>• <strong>10 days</strong> sick leave</li>
                      <li>• <strong>3 days</strong> family responsibility leave</li>
                    </ul>
                    <p className="mt-3 text-xs text-archi-300 border-t border-archi-600/50 pt-2">
                      📄 Source: HR Policy v2.3 • Last updated Jan 2026
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need for{' '}
              <span className="text-archi-400">Knowledge Access</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Not another chatbot. A serious knowledge system built for South African businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            {[
              {
                icon: HiOutlineDocumentText,
                title: 'Document Ingestion',
                description: 'Upload PDFs, Word docs, or paste content. Archi learns your company\'s knowledge instantly.',
              },
              {
                icon: FaWhatsapp,
                title: 'WhatsApp Native',
                description: 'Your team asks questions where they already are. No new apps to install.',
              },
              {
                icon: HiOutlineShieldCheck,
                title: 'Trusted Answers',
                description: 'Answers cite sources. Confidence gates prevent hallucinations. Audit logs for compliance.',
              },
              {
                icon: HiOutlineUserGroup,
                title: 'Human Handoff',
                description: 'When Archi isn\'t sure, it escalates to a human with full context preserved.',
              },
              {
                icon: HiOutlineChartBar,
                title: 'Analytics Dashboard',
                description: 'See top questions, gaps in knowledge, and deflection rates. Improve continuously.',
              },
              {
                icon: HiOutlineLightningBolt,
                title: 'Voice Notes',
                description: 'Send voice notes, get voice replies. Perfect for field teams and on-the-go access.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-archi-500/50 transition-all hover:shadow-lg hover:shadow-archi-500/10"
              >
                <div className="w-12 h-12 rounded-xl bg-archi-500/10 flex items-center justify-center mb-4 group-hover:bg-archi-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-archi-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Built for{' '}
              <span className="text-archi-400">Real Business Problems</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'HR & Onboarding', emoji: '👥' },
              { label: 'Compliance & Policy', emoji: '📋' },
              { label: 'Training & SOPs', emoji: '📚' },
              { label: 'Customer Support', emoji: '💬' },
              { label: 'IT Helpdesk', emoji: '🖥️' },
              { label: 'Property Management', emoji: '🏢' },
              { label: 'Medical Practices', emoji: '🏥' },
              { label: 'Legal & Finance', emoji: '⚖️' },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-archi-500/30 transition-all text-center"
              >
                <span className="text-2xl mb-2 block">{useCase.emoji}</span>
                <span className="text-sm font-medium text-slate-300">{useCase.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-slate-400">No hidden fees. No enterprise sales calls. Just results.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <h3 className="text-lg font-semibold">Starter</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">R3,000</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> 1 WhatsApp number</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> 50 documents</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> 1,000 messages/month</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> Basic analytics</li>
              </ul>
              <Link href="/auth?plan=starter" className="block w-full py-3 text-center rounded-lg border border-slate-600 hover:bg-slate-800/50 transition-all text-sm font-medium">
                Get Started
              </Link>
            </div>

            {/* Professional */}
            <div className="p-6 rounded-2xl bg-archi-500/10 border-2 border-archi-500/50 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-archi-500 text-white text-xs font-medium rounded-full">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold">Professional</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">R7,500</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> 3 WhatsApp numbers</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> Unlimited documents</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> 5,000 messages/month</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> Voice notes</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> Human handoff</li>
              </ul>
              <Link href="/auth?plan=professional" className="block w-full py-3 text-center rounded-lg bg-archi-500 hover:bg-archi-400 transition-all text-sm font-medium">
                Get Started
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <h3 className="text-lg font-semibold">Enterprise</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> Unlimited everything</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> Custom integrations</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> SLA & Priority support</li>
                <li className="flex items-center gap-2"><HiOutlineCheck className="text-archi-400" /> On-premise option</li>
              </ul>
              <Link href="/contact" className="block w-full py-3 text-center rounded-lg border border-slate-600 hover:bg-slate-800/50 transition-all text-sm font-medium">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Turn Your Docs Into an Assistant?
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Get Archi set up for your business in 7 days. No technical knowledge required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/demo"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium bg-archi-500 hover:bg-archi-400 text-white rounded-xl transition-all shadow-lg shadow-archi-500/25"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium border border-slate-700 hover:border-slate-600 text-white rounded-xl transition-all"
            >
              Book a Demo Call
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-archi-400 to-archi-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-lg font-semibold">Archi</span>
              </div>
              <p className="text-sm text-slate-400">
                Your company's knowledge, accessible on WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/popia" className="hover:text-white transition-colors">POPIA Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Archi. Built in South Africa 🇿🇦
            </p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/archi_ai" className="text-slate-400 hover:text-white transition-colors">Twitter</a>
              <a href="https://linkedin.com/company/archi-ai" className="text-slate-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="https://github.com/archi-ai" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
