import { Metadata } from 'next';
import LandingPage from './components/LandingPage';

export const metadata: Metadata = {
  title: 'Archi - Your Company\'s Knowledge on WhatsApp',
  description: 'Archi is a WhatsApp-based AI assistant trained on your company\'s documents, knowledge, and processes. Ask Archi — get trusted answers instantly.',
  alternates: {
    canonical: 'https://archi.ai',
  },
};

// JSON-LD structured data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Archi',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser, WhatsApp',
  description: 'WhatsApp-first AI knowledge assistant for businesses. Upload your documents, train your assistant, answer questions instantly.',
  url: 'https://archi.ai',
  softwareVersion: '1.0',
  author: {
    '@type': 'Organization',
    name: 'Archi',
    url: 'https://archi.ai',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ZAR',
    description: 'Free trial available',
  },
  featureList: [
    'WhatsApp Integration',
    'Document Upload & Processing',
    'AI-Powered Answers',
    'Multi-tenant Architecture',
    'Audit Trails',
    'Human Handoff',
    'Voice Note Support',
    'POPIA Compliant',
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
