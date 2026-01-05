'use client';

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Archi",
  "url": "https://archi-next.vercel.app",
  "logo": "https://archi-next.vercel.app/icon.svg",
  "description": "WhatsApp-first AI assistant trained on your company's documents",
  "sameAs": [
    "https://twitter.com/archi_ai"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": ["English"]
  }
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Archi",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "ZAR"
  },
  "description": "Transform your company documents into a WhatsApp-first AI assistant. Instant answers from your knowledge base with audit trails, POPIA compliance, and seamless human handoff.",
  "featureList": [
    "WhatsApp Integration",
    "AI-Powered Responses",
    "Document Processing",
    "Knowledge Base Management",
    "Audit Trails",
    "POPIA Compliance",
    "Human Handoff",
    "Multi-tenant Support"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150"
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Archi",
  "url": "https://archi-next.vercel.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://archi-next.vercel.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Archi?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Archi is a WhatsApp-based AI assistant that's trained on your company's documents, knowledge, and processes. It enables your team and customers to ask questions and get trusted, accurate answers instantly via WhatsApp."
      }
    },
    {
      "@type": "Question",
      "name": "How does Archi work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You upload your documents (PDFs, Word docs, policies, etc.) and Archi processes them using advanced AI. When someone asks a question on WhatsApp, Archi searches through your knowledge base and provides accurate, contextual answers with source citations."
      }
    },
    {
      "@type": "Question",
      "name": "Is Archi POPIA compliant?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Archi is designed with POPIA compliance in mind. All data is encrypted, audit trails are maintained, and you have full control over what information is shared through the AI assistant."
      }
    },
    {
      "@type": "Question",
      "name": "Can Archi hand off to a human agent?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Archi includes seamless human handoff capabilities. When the AI can't answer a question or when a user requests to speak with a human, the conversation is automatically escalated to your team."
      }
    }
  ]
};

export function JsonLd({ type = 'all' }: { type?: 'all' | 'organization' | 'software' | 'website' | 'faq' }) {
  const schemas = [];
  
  if (type === 'all' || type === 'organization') {
    schemas.push(organizationSchema);
  }
  if (type === 'all' || type === 'software') {
    schemas.push(softwareApplicationSchema);
  }
  if (type === 'all' || type === 'website') {
    schemas.push(websiteSchema);
  }
  if (type === 'all' || type === 'faq') {
    schemas.push(faqSchema);
  }
  
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export default JsonLd;
