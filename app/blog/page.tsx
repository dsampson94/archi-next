'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineUser, HiOutlineArrowRight } from 'react-icons/hi';

const blogPosts = [
  {
    slug: 'introducing-per-message-pricing',
    title: 'Introducing Per-Message Pricing: Pay Only for What You Use',
    excerpt: 'We\'re moving away from monthly subscriptions to a simple, transparent per-message pricing model. Here\'s why and what it means for you.',
    author: 'Archi Team',
    date: '2025-01-15',
    readTime: '4 min read',
    category: 'Product Updates',
    content: `
# Introducing Per-Message Pricing

We've listened to your feedback, and we're excited to announce a major change to how Archi pricing works.

## The Problem with Monthly Subscriptions

Traditional SaaS pricing forces you to predict your usage and pay for capacity you might not need. This creates several problems:

1. **Overpaying** - You pay for 5,000 messages even if you only use 500
2. **Surprise limits** - Hit your cap mid-month and face overage charges
3. **Inflexibility** - Can't easily scale up or down as needs change

## Our New Approach: Per-Message Pricing

Starting today, Archi uses simple per-message pricing:

- **No monthly fees** - Only pay when your bot responds
- **Multiple AI models** - Choose from GPT-4, Claude, Gemini, and more
- **Transparent costs** - See exactly what each message costs
- **No commitments** - Add credits whenever you need them

## What This Means for You

### For Small Businesses
Pay just a few Rand per day for occasional use. Perfect for internal HR bots or simple customer FAQ assistants.

### For Growing Companies
Scale up naturally as your usage grows. No need to predict monthly volumes or upgrade plans.

### For Enterprises
Get volume discounts and enterprise features. Contact us for custom pricing.

## Model Pricing Examples

Here's what typical messages cost:

| Model | Cost per Message |
|-------|------------------|
| GPT-4o Mini | ~R0.03 |
| Claude 3 Haiku | ~R0.05 |
| GPT-4o | ~R0.28 |
| Llama 3.1 8B | ~R0.01 |

## Getting Started

1. Sign up for a free account
2. Get $5 in free credits
3. Create your first bot
4. Only pay for what you use

[Get Started Free →](/auth?tab=register)

---

Questions? Reach out to us at support@archi.co.za
    `,
  },
  {
    slug: 'multi-model-ai-support',
    title: 'Choose Your AI: Multi-Model Support is Here',
    excerpt: 'Archi now supports 13+ AI models from OpenAI, Anthropic, Google, Mistral, and more. Pick the perfect model for your use case.',
    author: 'Archi Team',
    date: '2025-01-10',
    readTime: '5 min read',
    category: 'Product Updates',
    content: `
# Choose Your AI: Multi-Model Support

Not all AI models are created equal. Different models excel at different tasks, and now you can choose the best one for your needs.

## Why Multi-Model Matters

### Speed vs. Intelligence Trade-off
- **Fast models** like Llama 3.1 8B respond instantly but may miss nuance
- **Intelligent models** like GPT-4o handle complex queries but cost more

### Cost Optimization
- Use cheap models for simple FAQ queries
- Reserve expensive models for complex reasoning tasks

### No Vendor Lock-in
- Switch between providers anytime
- Experiment with different models to find what works

## Available Models

### OpenAI
- **GPT-4o** - Most capable, best for complex tasks
- **GPT-4o Mini** - Great balance of speed and capability
- **GPT-3.5 Turbo** - Legacy but still capable

### Anthropic
- **Claude 3 Opus** - Anthropic's most intelligent model
- **Claude 3 Sonnet** - Balanced speed and intelligence
- **Claude 3 Haiku** - Lightning fast responses

### Google
- **Gemini 1.5 Pro** - Advanced reasoning
- **Gemini 1.5 Flash** - Extremely fast and cheap

### Mistral
- **Mistral Large** - European AI powerhouse
- **Mistral Small** - Efficient and capable

### Groq (Llama)
- **Llama 3.1 70B** - Open-source powerhouse
- **Llama 3.1 8B** - Ultra-low cost option

## How to Choose

1. **Start with GPT-4o Mini** - Best value for most use cases
2. **Try Claude 3 Haiku** if you need faster responses
3. **Use GPT-4o** for complex reasoning tasks
4. **Consider Llama** for high-volume, cost-sensitive applications

## Switching Models

You can change models anytime:

1. Go to Dashboard → Agents
2. Select your bot
3. Change the AI Model dropdown
4. Save

The change takes effect immediately for new conversations.

---

Ready to try different models? [Start experimenting →](/dashboard/agents)
    `,
  },
  {
    slug: 'building-hr-assistant',
    title: 'How to Build an HR Assistant in 10 Minutes',
    excerpt: 'A step-by-step guide to creating an AI-powered HR assistant that answers employee questions about policies, leave, and benefits.',
    author: 'Archi Team',
    date: '2025-01-05',
    readTime: '6 min read',
    category: 'Tutorials',
    content: `
# Building an HR Assistant in 10 Minutes

Your HR team spends hours answering the same questions: "How much leave do I have?", "What's our work-from-home policy?", "How do I claim expenses?"

Let's build an AI assistant that handles these questions automatically.

## What You'll Need

1. An Archi account (free)
2. Your HR policy documents (PDF or Word)
3. 10 minutes

## Step 1: Create Your Bot (2 minutes)

1. Log into your Archi dashboard
2. Click "Create New Agent"
3. Name it "HR Assistant"
4. Choose GPT-4o Mini as your model (best value)

## Step 2: Configure the Personality (3 minutes)

Add this system prompt:

\`\`\`
You are the HR Assistant for [Company Name]. 

Your role is to help employees with questions about:
- Leave policies and balances
- Benefits and medical aid
- Expense claims
- Work-from-home policies
- Company procedures

Guidelines:
- Always be professional and helpful
- Cite the specific policy section in your answers
- If unsure, recommend contacting HR directly
- Never share confidential employee information
- Be concise but complete
\`\`\`

## Step 3: Upload Documents (3 minutes)

Go to Documents and upload:
- Employee handbook
- Leave policy
- Benefits guide
- Expense policy
- Any other relevant documents

Wait for processing to complete (usually under a minute).

## Step 4: Test Your Bot (2 minutes)

Try asking questions like:
- "How many days of annual leave do I get?"
- "What's the process for claiming travel expenses?"
- "Can I work from home on Fridays?"

Check that the answers are accurate and cite sources.

## Step 5: Share with Your Team

Go to WhatsApp Setup and share the link or QR code with your team.

## Best Practices

1. **Keep documents updated** - Remove outdated policies
2. **Review conversations** - Check what employees are asking
3. **Iterate on prompts** - Improve the system prompt based on feedback
4. **Set expectations** - Tell employees it's an AI (not a human)

## Example Conversation

> **Employee**: How do I request annual leave?
>
> **HR Assistant**: Based on the Leave Policy (Section 3.2):
>
> To request annual leave:
> 1. Submit a leave request via ESS at least 5 working days in advance
> 2. Your manager will approve/decline within 2 working days
> 3. Once approved, you'll receive confirmation via email
>
> For urgent leave requests, speak directly with your manager.
>
> 📄 Source: Leave Policy v2.3, Section 3.2

---

Need help setting this up? [Contact us →](/contact)
    `,
  },
  {
    slug: 'whatsapp-vs-web-chat',
    title: 'Why WhatsApp Beats Traditional Web Chat',
    excerpt: 'Compare WhatsApp AI assistants to traditional website chatbots. Spoiler: WhatsApp wins on adoption, engagement, and user experience.',
    author: 'Archi Team',
    date: '2024-12-20',
    readTime: '4 min read',
    category: 'Insights',
    content: `
# Why WhatsApp Beats Traditional Web Chat

We've all seen website chatbots. They pop up in the corner, ask generic questions, and often frustrate more than they help.

WhatsApp-first AI assistants are different. Here's why.

## The Numbers Don't Lie

- **2 billion** people use WhatsApp globally
- **98%** message open rate (vs. 20% for email)
- **90%** of messages read within 3 seconds
- **67%** of South Africans use WhatsApp daily

## Why Users Prefer WhatsApp

### 1. No New App to Download
Your employees and customers already have WhatsApp. No friction, no training needed.

### 2. Conversations That Continue
Unlike web chat that disappears when you close the browser, WhatsApp conversations persist. Ask a question on Monday, continue on Friday.

### 3. Works Offline
Start a message offline, it sends when you reconnect. Perfect for field teams with spotty internet.

### 4. Voice Notes
Can't type? Send a voice note. Perfect for complex questions or on-the-go queries.

### 5. Rich Media
Share documents, images, and locations. Get back formatted responses with links and attachments.

## Web Chat Problems

- **High abandonment** - Users leave before getting answers
- **Lost context** - Close the browser, lose the conversation
- **Desktop only** - Mobile web chat is often terrible
- **Training required** - "Click the chat icon, then select your issue..."

## The Business Case

### Customer Support
- 40% reduction in support tickets
- 24/7 availability without extra staff
- Faster resolution times

### Internal Knowledge
- Employees get instant answers
- Reduces HR/IT ticket volume
- Works anywhere (office, home, field)

### Sales
- Qualify leads automatically
- Answer product questions instantly
- Never miss a query outside business hours

## Making the Switch

Already have a web chatbot? You can run both. Start routing some conversations to WhatsApp and measure the difference.

[Start your free trial →](/auth?tab=register)
    `,
  },
];

export default function BlogPage() {
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
              <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</Link>
              <Link href="/blog" className="text-sm text-archi-400 font-medium">Blog</Link>
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
            Archi{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-archi-400 to-archi-300">
              Blog
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-400"
          >
            Product updates, tutorials, and insights on AI-powered knowledge management.
          </motion.p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-archi-500/30 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 text-xs font-medium bg-archi-500/20 text-archi-400 rounded-full">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <HiOutlineClock className="w-4 h-4" />
                      {post.readTime}
                    </span>
                    <span>{new Date(post.date).toLocaleDateString('en-ZA', { 
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mb-2 hover:text-archi-400 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                
                <p className="text-slate-400 mb-4">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <HiOutlineUser className="w-4 h-4" />
                    {post.author}
                  </div>
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="flex items-center gap-1 text-sm text-archi-400 hover:text-archi-300 transition-colors"
                  >
                    Read more
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-slate-400 mb-6">
            Get the latest product updates, tutorials, and AI insights delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-archi-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-archi-500 hover:bg-archi-400 text-white font-medium rounded-lg transition-all"
            >
              Subscribe
            </button>
          </form>
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
