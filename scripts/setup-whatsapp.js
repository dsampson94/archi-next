// Run this script to set up your first tenant and WhatsApp number
// Usage: node scripts/setup-whatsapp.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up WhatsApp configuration...\n');

  // Create a tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      plan: 'STARTER',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Tenant created:', tenant.name);

  // Create WhatsApp number configuration
  const whatsappNumber = await prisma.whatsappNumber.upsert({
    where: { phoneNumber: '+14155238886' },
    update: {
      isActive: true,
      tenantId: tenant.id,
    },
    create: {
      phoneNumber: '+14155238886',
      displayName: 'Demo WhatsApp Bot',
      provider: 'TWILIO',
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      isActive: true,
      isVerified: true,
      verifiedAt: new Date(),
      tenantId: tenant.id,
    },
  });
  console.log('✅ WhatsApp number configured:', whatsappNumber.phoneNumber);

  // Create a default agent (find or create)
  let agent = await prisma.agent.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Default Agent'
    }
  });

  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        tenantId: tenant.id,
        name: 'Default Agent',
        systemPrompt: `You are a helpful AI assistant. Answer questions based on the provided context. 
If you don't know the answer, say so politely and offer to help with something else.
Be friendly, professional, and concise.`,
        isActive: true,
        confidenceThreshold: 0.7,
        temperature: 0.7,
        model: 'gpt-4-turbo-preview',
      },
    });
  }
  console.log('✅ Agent created:', agent.name);

  console.log('\n🎉 Setup complete! You can now receive WhatsApp messages.\n');
  console.log('Next steps:');
  console.log('1. Send a WhatsApp message to +1 415 523 8886');
  console.log('2. Your bot should respond!');
  console.log('3. Check the Conversations page in your dashboard\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
