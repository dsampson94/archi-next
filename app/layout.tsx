import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://archi.ai'),
  title: {
    default: 'Archi - Your Company\'s Knowledge on WhatsApp',
    template: '%s | Archi'
  },
  description: 'Archi is a WhatsApp-based AI assistant trained on your company\'s documents, knowledge, and processes — so your people can ask questions and get trusted answers instantly.',
  keywords: [
    'WhatsApp AI',
    'knowledge management',
    'AI assistant',
    'document chatbot',
    'company knowledge base',
    'RAG',
    'retrieval augmented generation',
    'business automation',
    'employee onboarding',
    'HR assistant',
    'compliance bot',
    'South Africa AI',
    'POPIA compliant'
  ],
  authors: [{ name: 'Archi Team' }],
  creator: 'Archi',
  publisher: 'Archi',
  applicationName: 'Archi',
  category: 'Business Tools',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://archi.ai',
    siteName: 'Archi',
    title: 'Archi - Your Company\'s Knowledge on WhatsApp',
    description: 'Turn your internal docs into a WhatsApp-first AI assistant with audit trails and safe answers.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Archi - WhatsApp AI Knowledge Assistant',
      },
    ],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Archi - Your Company\'s Knowledge on WhatsApp',
    description: 'Turn your internal docs into a WhatsApp-first AI assistant with audit trails and safe answers.',
    images: ['/og-image.jpg'],
    creator: '@archi_ai',
  },
  
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Archi',
  },
  
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  
  manifest: '/manifest.json',
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
