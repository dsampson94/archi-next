'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  HiOutlineBookOpen,
  HiOutlineCode,
  HiOutlineLightningBolt,
  HiOutlineChevronRight,
  HiOutlineClipboard,
  HiOutlineCheck,
} from 'react-icons/hi';

const docs = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: HiOutlineLightningBolt,
    sections: [
      {
        title: 'Quick Start Guide',
        content: `
## Quick Start Guide

Get your AI assistant up and running in 5 minutes.

### Step 1: Create an Account

1. Go to [archi.co.za/auth](/auth?tab=register)
2. Sign up with your email
3. You'll receive $5 in free credits automatically

### Step 2: Create Your First Bot

1. Navigate to the Dashboard
2. Click "Create New Bot"
3. Give your bot a name (e.g., "HR Assistant")
4. Select an AI model (we recommend GPT-4o Mini for most use cases)
5. Click "Create"

### Step 3: Upload Your Documents

1. Go to the Documents section
2. Click "Upload Documents"
3. Select your files (PDF, DOCX, TXT, etc.)
4. Wait for processing to complete

### Step 4: Start Chatting on WhatsApp

1. Go to the WhatsApp section
2. Scan the QR code or click the link
3. Send a message to test your bot

That's it! Your AI assistant is now live on WhatsApp.
        `,
      },
      {
        title: 'Account Setup',
        content: `
## Account Setup

### Creating Your Account

Create an account at [archi.co.za/auth](/auth?tab=register). You'll need:
- A valid email address
- A password (minimum 8 characters)
- Your company name

### Free Credits

All new accounts receive $5 in free credits. This is enough for approximately:
- 3,500+ messages with GPT-4o Mini
- 125,000+ messages with Llama 3.1 8B
- 160+ messages with GPT-4o

### Adding Credits

1. Go to Dashboard → Billing
2. Click "Add Credits"
3. Select an amount
4. Complete payment via PayPal

Credits never expire and carry over indefinitely.
        `,
      },
    ],
  },
  {
    id: 'workspaces',
    title: 'Workspaces & Bots',
    icon: HiOutlineBookOpen,
    sections: [
      {
        title: 'Understanding Workspaces',
        content: `
## Workspaces

Workspaces help you organize your AI assistants by business, department, or project.

### What is a Workspace?

A workspace is a container that holds:
- Multiple AI bots
- Documents and knowledge bases
- Team members
- Billing and usage data

### Creating a Workspace

1. Click the workspace dropdown in the sidebar
2. Select "Create New Workspace"
3. Enter a name and description
4. Click "Create"

### Switching Workspaces

Use the dropdown in the sidebar to switch between workspaces. Each workspace has its own:
- Bots and configurations
- Document library
- Analytics
- Credit balance

### Use Cases for Multiple Workspaces

- **Agencies**: One workspace per client
- **Enterprises**: One workspace per department
- **Developers**: Separate dev/staging/production environments
        `,
      },
      {
        title: 'Managing Bots',
        content: `
## Managing Bots

Each workspace can have multiple AI bots, each with its own personality and knowledge base.

### Creating a Bot

1. Navigate to Dashboard → Agents
2. Click "Create New Agent"
3. Configure:
   - **Name**: What users will see
   - **System Prompt**: The bot's personality and instructions
   - **AI Model**: Which LLM to use
   - **Knowledge Base**: Which documents to reference

### Choosing an AI Model

| Model | Best For | Cost |
|-------|----------|------|
| GPT-4o Mini | General use, best value | ~R0.03/msg |
| Claude 3 Haiku | Fast responses | ~R0.05/msg |
| GPT-4o | Complex reasoning | ~R0.28/msg |
| Llama 3.1 8B | Ultra-low cost | ~R0.01/msg |

### System Prompts

The system prompt defines your bot's personality. Example:

\`\`\`
You are a helpful HR assistant for ABC Company. 
Always be professional and refer to the employee handbook when answering questions.
If you're unsure about something, say so and recommend contacting HR directly.
\`\`\`
        `,
      },
    ],
  },
  {
    id: 'documents',
    title: 'Documents & Knowledge',
    icon: HiOutlineBookOpen,
    sections: [
      {
        title: 'Uploading Documents',
        content: `
## Uploading Documents

Your AI assistant learns from the documents you upload.

### Supported Formats

- **PDF** - Scanned documents are OCR'd automatically
- **DOCX** - Microsoft Word documents
- **TXT** - Plain text files
- **XLSX** - Excel spreadsheets (text content only)
- **MD** - Markdown files

### How to Upload

1. Go to Dashboard → Documents
2. Click "Upload Documents"
3. Drag and drop files or click to browse
4. Wait for processing

### Processing Status

- **Pending**: Document is queued
- **Processing**: Being analyzed and indexed
- **Ready**: Available for your bot to use
- **Error**: Something went wrong (check the error message)

### Best Practices

1. **Keep files under 10MB** for faster processing
2. **Use clear file names** for easy organization
3. **Update regularly** when source documents change
4. **Remove outdated docs** to prevent incorrect answers
        `,
      },
      {
        title: 'Knowledge Bases',
        content: `
## Knowledge Bases

Documents are stored in vector databases for semantic search.

### How It Works

1. Documents are split into smaller chunks
2. Each chunk is converted to a vector embedding
3. When a user asks a question, we find the most relevant chunks
4. Those chunks are sent to the AI along with the question

### RAG (Retrieval Augmented Generation)

This technique ensures your bot:
- Always references your actual documents
- Cites sources in responses
- Stays up-to-date with your content
- Reduces AI hallucinations

### Source Citations

Every response includes citations like:
> Based on the HR Policy Document (Section 4.2)...

Users can trust the information because it comes directly from your documents.
        `,
      },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: HiOutlineCode,
    sections: [
      {
        title: 'Authentication',
        content: `
## API Authentication

All API requests require authentication via JWT tokens.

### Getting Your API Token

1. Log in to your dashboard
2. Go to Settings → API
3. Click "Generate API Key"
4. Copy and store your key securely

### Using the Token

Include the token in the Authorization header:

\`\`\`bash
curl -X GET https://archi.co.za/api/conversations \\
  -H "Authorization: Bearer YOUR_API_TOKEN"
\`\`\`

### Token Security

- Never share your API token
- Rotate keys periodically
- Use environment variables, not hardcoded values
        `,
      },
      {
        title: 'Endpoints',
        content: `
## API Endpoints

### Conversations

\`\`\`
GET  /api/conversations          # List all conversations
GET  /api/conversations/:id      # Get a specific conversation
POST /api/conversations/:id/reply # Send a message
\`\`\`

### Documents

\`\`\`
GET  /api/documents              # List all documents
POST /api/documents              # Upload a new document
GET  /api/documents/:id          # Get document details
DELETE /api/documents/:id        # Delete a document
\`\`\`

### Agents (Bots)

\`\`\`
GET  /api/agents                 # List all agents
POST /api/agents                 # Create a new agent
PUT  /api/agents/:id             # Update an agent
DELETE /api/agents/:id           # Delete an agent
\`\`\`

### Webhooks

\`\`\`
POST /api/webhooks/whatsapp      # WhatsApp message webhook
\`\`\`

### Example: Send a Reply

\`\`\`javascript
const response = await fetch('/api/conversations/123/reply', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, how can I help you?',
  }),
});
\`\`\`
        `,
      },
    ],
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative group">
      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 p-2 rounded-lg bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <HiOutlineCheck className="w-4 h-4 text-green-400" />
        ) : (
          <HiOutlineClipboard className="w-4 h-4 text-slate-400" />
        )}
      </button>
    </div>
  );
}

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState(docs[0].id);
  const [activeSection, setActiveSection] = useState(0);

  const currentDoc = docs.find(d => d.id === activeDoc)!;
  const currentSection = currentDoc.sections[activeSection];

  // Simple markdown renderer
  const renderMarkdown = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let listItems: string[] = [];
    
    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(<CodeBlock key={i} code={codeContent.trim()} />);
          codeContent = '';
        }
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }
      
      if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-xl font-semibold mt-6 mb-3">{line.slice(4)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        listItems.push(line.slice(2));
        // Check if next line is not a list item
        if (!lines[i + 1]?.match(/^[-*] /)) {
          elements.push(
            <ul key={i} className="list-disc list-inside space-y-1 my-2 text-slate-300">
              {listItems.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
          listItems = [];
        }
      } else if (line.match(/^\d+\. /)) {
        const match = line.match(/^\d+\. (.+)$/);
        if (match) {
          listItems.push(match[1]);
          // Check if next line is not a numbered item
          if (!lines[i + 1]?.match(/^\d+\. /)) {
            elements.push(
              <ol key={i} className="list-decimal list-inside space-y-1 my-2 text-slate-300">
                {listItems.map((item, j) => <li key={j}>{item}</li>)}
              </ol>
            );
            listItems = [];
          }
        }
      } else if (line.startsWith('|')) {
        // Skip table handling for now
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-archi-500 pl-4 my-4 text-slate-300 italic">
            {line.slice(2)}
          </blockquote>
        );
      } else if (line.trim()) {
        elements.push(<p key={i} className="my-2 text-slate-300">{line}</p>);
      }
    });
    
    return elements;
  };

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
              <Link href="/docs" className="text-sm text-archi-400 font-medium">Docs</Link>
              <Link href="/auth" className="px-4 py-2 text-sm font-medium bg-archi-500 hover:bg-archi-400 rounded-lg transition-all">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-slate-900/50 border-r border-slate-800/50 overflow-y-auto">
          <nav className="p-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Documentation
            </h2>
            {docs.map((doc) => (
              <div key={doc.id} className="mb-4">
                <button
                  onClick={() => { setActiveDoc(doc.id); setActiveSection(0); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                    activeDoc === doc.id 
                      ? 'bg-archi-500/20 text-archi-400' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <doc.icon className="w-4 h-4" />
                  {doc.title}
                </button>
                {activeDoc === doc.id && (
                  <div className="ml-6 mt-2 space-y-1">
                    {doc.sections.map((section, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSection(idx)}
                        className={`flex items-center gap-1 w-full px-2 py-1 text-left text-sm transition-colors ${
                          activeSection === idx 
                            ? 'text-archi-400' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <HiOutlineChevronRight className="w-3 h-3" />
                        {section.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 min-h-screen">
          <div className="max-w-3xl mx-auto px-8 py-12">
            <motion.div
              key={`${activeDoc}-${activeSection}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderMarkdown(currentSection.content)}
            </motion.div>

            {/* Navigation */}
            <div className="mt-12 pt-8 border-t border-slate-800 flex justify-between">
              <button
                onClick={() => {
                  if (activeSection > 0) {
                    setActiveSection(activeSection - 1);
                  } else {
                    const currentIndex = docs.findIndex(d => d.id === activeDoc);
                    if (currentIndex > 0) {
                      setActiveDoc(docs[currentIndex - 1].id);
                      setActiveSection(docs[currentIndex - 1].sections.length - 1);
                    }
                  }
                }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  if (activeSection < currentDoc.sections.length - 1) {
                    setActiveSection(activeSection + 1);
                  } else {
                    const currentIndex = docs.findIndex(d => d.id === activeDoc);
                    if (currentIndex < docs.length - 1) {
                      setActiveDoc(docs[currentIndex + 1].id);
                      setActiveSection(0);
                    }
                  }
                }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
