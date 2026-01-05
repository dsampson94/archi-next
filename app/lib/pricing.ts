// Token pricing (in USD) - tokens per dollar
export const TOKEN_PACKAGES = [
  { id: 'starter', tokens: 5000, price: 5, bonus: 0, label: '5,000 tokens', popular: false },
  { id: 'basic', tokens: 25000, price: 20, bonus: 2500, label: '25,000 tokens', popular: true },
  { id: 'pro', tokens: 100000, price: 75, bonus: 15000, label: '100,000 tokens', popular: false },
  { id: 'enterprise', tokens: 500000, price: 300, bonus: 100000, label: '500,000 tokens', popular: false },
] as const;

export type TokenPackage = typeof TOKEN_PACKAGES[number];

// Model pricing (tokens consumed per 1K input/output tokens)
export const MODEL_PRICING = {
  // OpenAI
  'gpt-4-turbo-preview': { input: 10, output: 30, label: 'GPT-4 Turbo', provider: 'OPENAI' },
  'gpt-4o': { input: 5, output: 15, label: 'GPT-4o', provider: 'OPENAI' },
  'gpt-4o-mini': { input: 0.15, output: 0.6, label: 'GPT-4o Mini', provider: 'OPENAI' },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5, label: 'GPT-3.5 Turbo', provider: 'OPENAI' },
  // Anthropic
  'claude-3-opus': { input: 15, output: 75, label: 'Claude 3 Opus', provider: 'ANTHROPIC' },
  'claude-3-sonnet': { input: 3, output: 15, label: 'Claude 3 Sonnet', provider: 'ANTHROPIC' },
  'claude-3-haiku': { input: 0.25, output: 1.25, label: 'Claude 3 Haiku', provider: 'ANTHROPIC' },
  // Google
  'gemini-1.5-pro': { input: 3.5, output: 10.5, label: 'Gemini 1.5 Pro', provider: 'GOOGLE' },
  'gemini-1.5-flash': { input: 0.075, output: 0.3, label: 'Gemini 1.5 Flash', provider: 'GOOGLE' },
  // Mistral
  'mistral-large': { input: 4, output: 12, label: 'Mistral Large', provider: 'MISTRAL' },
  'mistral-small': { input: 1, output: 3, label: 'Mistral Small', provider: 'MISTRAL' },
  // Groq (fast inference)
  'llama-3.1-70b': { input: 0.59, output: 0.79, label: 'Llama 3.1 70B', provider: 'GROQ' },
  'llama-3.1-8b': { input: 0.05, output: 0.08, label: 'Llama 3.1 8B', provider: 'GROQ' },
} as const;

export type ModelId = keyof typeof MODEL_PRICING;
export type ModelPricing = typeof MODEL_PRICING[ModelId];

// Helper function to calculate token cost
export function calculateTokenCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as ModelId];
  if (!pricing) {
    // Default to GPT-4o-mini pricing if model not found
    return Math.ceil((inputTokens / 1000) * 0.15 + (outputTokens / 1000) * 0.6);
  }
  
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  
  return Math.ceil(inputCost + outputCost);
}

// Get available models with pricing info
export function getAvailableModels() {
  return Object.entries(MODEL_PRICING).map(([id, info]) => ({
    id,
    label: info.label,
    provider: info.provider,
    inputCost: info.input,
    outputCost: info.output,
  }));
}
