# Archi - WhatsApp-First AI Knowledge Assistant

**Your company's knowledge, accessible on WhatsApp.**

Archi turns your documents, SOPs, and processes into an AI assistant your team can ask via WhatsApp. Trusted answers. Audit trails. Human handoff.

## Features

- 📄 **Document Ingestion** - Upload PDFs, Word docs, or paste content
- 💬 **WhatsApp Native** - Your team asks questions where they already are
- ✅ **Trusted Answers** - Answers cite sources with confidence gates
- 👥 **Human Handoff** - Escalates to humans when unsure
- 📊 **Analytics Dashboard** - See top questions and knowledge gaps
- 🎙️ **Voice Notes** - Send voice notes, get voice replies

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (we recommend Supabase)
- OpenAI API key
- Twilio account (for WhatsApp)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/archi-next.git
cd archi-next
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure your `.env.local` with:
   - Database URL
   - OpenAI API key
   - Twilio credentials
   - JWT secret

5. Set up the database:
```bash
npm run db:push
npm run db:generate
```

6. Start the development server:
```bash
npm run dev
```

## Project Structure

```
archi-next/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── documents/    # Document management
│   │   └── webhooks/     # WhatsApp webhooks
│   ├── auth/             # Auth pages
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── dashboard/        # Dashboard pages
│   └── lib/              # Utilities
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT with HTTP-only cookies
- **AI**: OpenAI GPT-4 + LangChain
- **Vector Store**: Pinecone / pgvector
- **WhatsApp**: Twilio API
- **Styling**: Tailwind CSS + Framer Motion

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for GPT |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `JWT_SECRET` | Secret for JWT signing |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Self-hosted

```bash
npm run build
npm start
```

## License

Private - All rights reserved.

## Support

For support, email support@archi.ai or join our Slack community.
