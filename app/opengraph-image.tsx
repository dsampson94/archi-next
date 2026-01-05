import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Archi - Your Company\'s Knowledge on WhatsApp';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(20, 184, 166, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              fontWeight: 'bold',
              color: 'white',
              boxShadow: '0 25px 50px -12px rgba(20, 184, 166, 0.4)',
            }}
          >
            A
          </div>
        </div>
        
        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 20,
            textAlign: 'center',
            display: 'flex',
          }}
        >
          Archi
        </div>
        
        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          Your Company's Knowledge on WhatsApp
        </div>
        
        {/* Features */}
        <div
          style={{
            display: 'flex',
            marginTop: 50,
            gap: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#14b8a6',
              fontSize: 24,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            AI-Powered Answers
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#14b8a6',
              fontSize: 24,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Audit Trails
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#14b8a6',
              fontSize: 24,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            POPIA Compliant
          </div>
        </div>
        
        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: '#64748b',
            display: 'flex',
          }}
        >
          archi-next.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
