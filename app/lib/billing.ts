import prisma from './prisma';
import { MODEL_PRICING, ModelId } from './pricing';

export interface TokenUsageResult {
  success: boolean;
  tokensUsed: number;
  remainingBalance: number;
  error?: string;
}

/**
 * Calculate tokens to deduct based on model and usage
 */
export function calculateTokenCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as ModelId];
  if (!pricing) {
    // Default to GPT-4o pricing if model not found
    return Math.ceil((inputTokens / 1000) * 5 + (outputTokens / 1000) * 15);
  }
  
  // Calculate cost (pricing is per 1K tokens)
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  
  // Return total, rounded up to nearest whole token
  return Math.ceil(inputCost + outputCost);
}

/**
 * Deduct tokens from workspace balance
 */
export async function deductTokens(
  tenantId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  agentId?: string,
  description?: string
): Promise<TokenUsageResult> {
  const tokensToDeduct = calculateTokenCost(model, inputTokens, outputTokens);
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { tokenBalance: true, name: true },
      });

      if (!tenant) {
        throw new Error('Workspace not found');
      }

      // Check if enough balance
      if (tenant.tokenBalance < tokensToDeduct) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const newBalance = tenant.tokenBalance - tokensToDeduct;

      // Update balance
      await tx.tenant.update({
        where: { id: tenantId },
        data: { tokenBalance: newBalance },
      });

      // Create transaction record
      await tx.tokenTransaction.create({
        data: {
          tenantId,
          type: 'USAGE',
          amount: -tokensToDeduct, // Negative for usage
          balance: newBalance,
          model,
          agentId,
          inputTokens,
          outputTokens,
          description: description || `API call using ${model}`,
        },
      });

      return { newBalance };
    });

    return {
      success: true,
      tokensUsed: tokensToDeduct,
      remainingBalance: result.newBalance,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
      return {
        success: false,
        tokensUsed: 0,
        remainingBalance: 0,
        error: 'Insufficient token balance. Please purchase more tokens.',
      };
    }
    
    console.error('Token deduction error:', error);
    return {
      success: false,
      tokensUsed: 0,
      remainingBalance: 0,
      error: 'Failed to process token usage',
    };
  }
}

/**
 * Check if workspace has enough tokens
 */
export async function checkTokenBalance(
  tenantId: string,
  estimatedTokens: number
): Promise<{ hasBalance: boolean; currentBalance: number }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { tokenBalance: true },
  });

  return {
    hasBalance: (tenant?.tokenBalance || 0) >= estimatedTokens,
    currentBalance: tenant?.tokenBalance || 0,
  };
}

/**
 * Add bonus tokens (e.g., for referrals, promotions)
 */
export async function addBonusTokens(
  tenantId: string,
  tokens: number,
  reason: string
): Promise<{ success: boolean; newBalance: number }> {
  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { tokenBalance: true },
    });

    const newBalance = (tenant?.tokenBalance || 0) + tokens;

    await tx.tenant.update({
      where: { id: tenantId },
      data: { tokenBalance: newBalance },
    });

    await tx.tokenTransaction.create({
      data: {
        tenantId,
        type: 'BONUS',
        amount: tokens,
        balance: newBalance,
        description: reason,
      },
    });

    return { newBalance };
  });

  return { success: true, newBalance: result.newBalance };
}

/**
 * Get available models with pricing info
 */
export function getAvailableModels() {
  return Object.entries(MODEL_PRICING).map(([id, info]) => ({
    id,
    ...info,
    costPer1kInput: info.input,
    costPer1kOutput: info.output,
  }));
}
