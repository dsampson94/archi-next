// Per-message pricing - Pay for what you use
// Base costs from providers (USD per 1K tokens)
export const BASE_MODEL_COSTS = {
  // OpenAI
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03, label: 'GPT-4 Turbo', provider: 'OPENAI' },
  'gpt-4o': { input: 0.005, output: 0.015, label: 'GPT-4o', provider: 'OPENAI' },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006, label: 'GPT-4o Mini', provider: 'OPENAI' },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, label: 'GPT-3.5 Turbo', provider: 'OPENAI' },
  // Anthropic
  'claude-3-opus': { input: 0.015, output: 0.075, label: 'Claude 3 Opus', provider: 'ANTHROPIC' },
  'claude-3-sonnet': { input: 0.003, output: 0.015, label: 'Claude 3 Sonnet', provider: 'ANTHROPIC' },
  'claude-3-haiku': { input: 0.00025, output: 0.00125, label: 'Claude 3 Haiku', provider: 'ANTHROPIC' },
  // Google
  'gemini-1.5-pro': { input: 0.0035, output: 0.0105, label: 'Gemini 1.5 Pro', provider: 'GOOGLE' },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003, label: 'Gemini 1.5 Flash', provider: 'GOOGLE' },
  // Mistral
  'mistral-large': { input: 0.004, output: 0.012, label: 'Mistral Large', provider: 'MISTRAL' },
  'mistral-small': { input: 0.001, output: 0.003, label: 'Mistral Small', provider: 'MISTRAL' },
  // Groq (fast inference)
  'llama-3.1-70b': { input: 0.00059, output: 0.00079, label: 'Llama 3.1 70B', provider: 'GROQ' },
  'llama-3.1-8b': { input: 0.00005, output: 0.00008, label: 'Llama 3.1 8B', provider: 'GROQ' },
} as const;

// Markup percentage (100% = 2x the base cost)
export const MARKUP_PERCENTAGE = 100;

// User-facing pricing (with 100% markup) - USD per 1K tokens
export const MODEL_PRICING = Object.fromEntries(
  Object.entries(BASE_MODEL_COSTS).map(([id, info]) => [
    id,
    {
      input: info.input * (1 + MARKUP_PERCENTAGE / 100),
      output: info.output * (1 + MARKUP_PERCENTAGE / 100),
      label: info.label,
      provider: info.provider,
      baseCostInput: info.input,
      baseCostOutput: info.output,
    },
  ])
) as Record<keyof typeof BASE_MODEL_COSTS, {
  input: number;
  output: number;
  label: string;
  provider: string;
  baseCostInput: number;
  baseCostOutput: number;
}>;

// Average tokens per message (typical WhatsApp conversation)
export const AVG_TOKENS_PER_MESSAGE = {
  input: 150,  // User message + context
  output: 300, // AI response
};

// Estimate cost per message for each model (USD)
export function getEstimatedCostPerMessage(modelId: string): number {
  const pricing = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];
  if (!pricing) return 0.001; // Default fallback
  
  const inputCost = (AVG_TOKENS_PER_MESSAGE.input / 1000) * pricing.input;
  const outputCost = (AVG_TOKENS_PER_MESSAGE.output / 1000) * pricing.output;
  
  return inputCost + outputCost;
}

// Format price for display
export function formatPrice(usd: number): string {
  if (usd < 0.001) return '< $0.001';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

// Convert USD to ZAR (approximate)
export const USD_TO_ZAR = 18.5;

export function formatPriceZAR(usd: number): string {
  const zar = usd * USD_TO_ZAR;
  if (zar < 0.01) return '< R0.01';
  if (zar < 1) return `R${zar.toFixed(2)}`;
  return `R${zar.toFixed(2)}`;
}

export type ModelId = keyof typeof MODEL_PRICING;
export type ModelPricing = typeof MODEL_PRICING[ModelId];

// Helper function to calculate cost in USD
export function calculateMessageCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as ModelId];
  if (!pricing) {
    // Default to GPT-4o-mini pricing if model not found
    const defaultPricing = MODEL_PRICING['gpt-4o-mini'];
    return (inputTokens / 1000) * defaultPricing.input + (outputTokens / 1000) * defaultPricing.output;
  }
  
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  
  return inputCost + outputCost;
}

// Legacy function for backward compatibility
export function calculateTokenCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Convert USD cost to token equivalent (1 token = $0.001 for billing purposes)
  const usdCost = calculateMessageCost(model, inputTokens, outputTokens);
  return Math.ceil(usdCost * 1000);
}

// Get available models with pricing info
export function getAvailableModels() {
  return Object.entries(MODEL_PRICING).map(([id, info]) => ({
    id,
    label: info.label,
    provider: info.provider,
    inputCost: info.input,
    outputCost: info.output,
    costPerMessage: getEstimatedCostPerMessage(id),
  }));
}

// Get models grouped by provider
export function getModelsByProvider() {
  const models = getAvailableModels();
  return models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof models>);
}

// Get recommended models (best value)
export function getRecommendedModels() {
  return [
    { id: 'gpt-4o-mini', reason: 'Best value - fast & affordable' },
    { id: 'claude-3-haiku', reason: 'Fastest responses' },
    { id: 'gpt-4o', reason: 'Most capable for complex tasks' },
    { id: 'llama-3.1-8b', reason: 'Ultra-low cost' },
  ];
}

// Credit packages (USD)
// Users buy credits in USD, which are converted to internal "tokens" for tracking
// 1 USD = 1000 internal tokens for accounting purposes
export const CREDIT_PACKAGES = [
  { id: 'starter', credits: 5, price: 5, bonus: 0, label: '$5 Credits', popular: false },
  { id: 'basic', credits: 20, price: 20, bonus: 2, label: '$20 Credits', popular: true },
  { id: 'pro', credits: 50, price: 50, bonus: 10, label: '$50 Credits', popular: false },
  { id: 'enterprise', credits: 200, price: 200, bonus: 50, label: '$200 Credits', popular: false },
] as const;

export type CreditPackage = typeof CREDIT_PACKAGES[number];

// Legacy export for backward compatibility with existing billing code
// Maps credit packages to "token" format (1 credit = 1000 tokens internally)
export const TOKEN_PACKAGES = CREDIT_PACKAGES.map(pkg => ({
  id: pkg.id,
  tokens: (pkg.credits + pkg.bonus) * 1000, // Convert to internal tokens
  price: pkg.price,
  bonus: pkg.bonus * 1000, // Bonus in tokens
  label: pkg.label,
  popular: pkg.popular,
}));

export type TokenPackage = typeof TOKEN_PACKAGES[number];

// Convert USD balance to display format
export function formatBalance(tokens: number): string {
  const usd = tokens / 1000;
  return `$${usd.toFixed(2)}`;
}

// Estimate messages remaining based on model
export function estimateMessagesRemaining(tokens: number, modelId: string): number {
  const usdBalance = tokens / 1000;
  const costPerMessage = getEstimatedCostPerMessage(modelId);
  if (costPerMessage <= 0) return 0;
  return Math.floor(usdBalance / costPerMessage);
}
