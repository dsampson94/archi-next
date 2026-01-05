import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import JsonLd from '@/app/components/JsonLd';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://archi-next.vercel.app'),
  title: {
    default: 'Archi - WhatsApp AI Assistant for Your Business',
    template: '%s | Archi'
  },
  description: 'Transform your company documents into a WhatsApp-first AI assistant. Instant answers from your knowledge base with audit trails, POPIA compliance, and seamless human handoff.',
  keywords: [
    'WhatsApp AI assistant',
    'WhatsApp chatbot',
    'AI knowledge base',
    'business automation',
    'document AI',
    'RAG chatbot',
    'retrieval augmented generation',
    'customer support AI',
    'South Africa AI',
    'POPIA compliant AI',
    'property management AI',
    'HR chatbot',
    'employee onboarding bot',
    'internal knowledge management',
    'WhatsApp business API'
  ],
  authors: [{ name: 'Archi', url: 'https://archi-next.vercel.app' }],
  creator: 'Archi',
  publisher: 'Archi',
  applicationName: 'Archi',
  category: 'Business',
  classification: 'Business Software',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://archi-next.vercel.app',
    siteName: 'Archi',
    title: 'Archi - WhatsApp AI Assistant for Your Business',
    description: 'Transform your company documents into a WhatsApp-first AI assistant. Instant answers with audit trails and POPIA compliance.',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Archi - WhatsApp AI Assistant',
    description: 'Transform your company documents into a WhatsApp-first AI assistant with audit trails.',
    creator: '@archi_ai',
    site: '@archi_ai',
  },
  
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Archi',
    startupImage: [
      '/apple-touch-icon.png',
    ],
  },
  
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon',
  },
  
  manifest: '/manifest.json',
  
  alternates: {
    canonical: 'https://archi-next.vercel.app',
  },
  
  verification: {
    // Add these when you have them:
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  
  other: {
    'msapplication-TileColor': '#14b8a6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f766e' },
    { media: '(prefers-color-scheme: dark)', color: '#042f2e' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <JsonLd />
      </head>
      <body className={`${inter.className} antialiased bg-slate-950 text-white min-h-screen`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-slate-800 text-white border border-slate-700',
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
