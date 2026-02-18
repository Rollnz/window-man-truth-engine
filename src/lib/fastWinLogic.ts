import { fastWinProducts, honorableMentions, type FastWinProduct, type HonorableMention } from '@/data/fastWinData';

export interface FastWinAnswers {
  painPoint: string;
  orientation: string;
  currentStatus: string;
  budgetPriority: string;
}

export interface FastWinResult {
  product: FastWinProduct;
  matchScore: number;
  honorableMentions: HonorableMention[];
  reasoning: string;
}

interface ProductScore {
  productId: string;
  score: number;
  reasoning: string;
}

/**
 * Calculates the best-fit Fast Win product recommendation based on
 * user quiz answers. Scores each product across four weighted dimensions
 * (pain point, orientation, current status, budget) and returns the top match.
 * @param answers - The user's quiz responses
 * @returns The winning product, match score (0-100), honorable mentions, and reasoning
 */
export function calculateFastWin(answers: FastWinAnswers): FastWinResult {
  const scores: ProductScore[] = [];

  // Weight configuration
  const weights = {
    painPoint: 0.40,
    orientation: 0.20,
    currentStatus: 0.25,
    budgetPriority: 0.15,
  };

  // Calculate score for each product
  for (const product of fastWinProducts) {
    let score = 0;
    const reasoningParts: string[] = [];

    // Pain Point scoring (40% weight)
    const painPointScore = getPainPointScore(answers.painPoint, product.category);
    score += painPointScore * weights.painPoint;
    if (painPointScore > 0.5) {
      reasoningParts.push(`Directly addresses your ${answers.painPoint} concern`);
    }

    // Orientation scoring (20% weight) - mostly affects heat products
    const orientationScore = getOrientationScore(answers.orientation, product.category);
    score += orientationScore * weights.orientation;
    if (orientationScore > 0.7 && product.category === 'heat') {
      reasoningParts.push(`${answers.orientation}-facing homes benefit most from heat reduction`);
    }

    // Current Status scoring (25% weight)
    const statusScore = getStatusScore(answers.currentStatus, product.category);
    score += statusScore * weights.currentStatus;
    if (statusScore > 0.7) {
      reasoningParts.push(`Perfect upgrade path from ${answers.currentStatus} windows`);
    }

    // Budget Priority scoring (15% weight)
    const budgetScore = getBudgetScore(answers.budgetPriority, product.category);
    score += budgetScore * weights.budgetPriority;
    if (budgetScore > 0.7) {
      reasoningParts.push(`Aligns with your ${answers.budgetPriority} priority`);
    }

    scores.push({
      productId: product.id,
      score: score * 100,
      reasoning: reasoningParts.join('. '),
    });
  }

  // Sort by score and get winner
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  const winningProduct = fastWinProducts.find(p => p.id === winner.productId)!;

  return {
    product: winningProduct,
    matchScore: Math.round(winner.score),
    honorableMentions: honorableMentions[winner.productId] || [],
    reasoning: winner.reasoning || 'Best match based on your unique situation',
  };
}

/**
 * Scores how well a product category addresses the user's primary pain point.
 * @returns 0-1 relevance score
 */
function getPainPointScore(painPoint: string, productCategory: string): number {
  const mappings: Record<string, Record<string, number>> = {
    heat: { heat: 1.0, budget: 0.6, uv: 0.3, noise: 0.2, security: 0.1 },
    noise: { noise: 1.0, security: 0.4, heat: 0.2, budget: 0.3, uv: 0.1 },
    hurricanes: { security: 1.0, noise: 0.5, heat: 0.3, budget: 0.2, uv: 0.1 },
    security: { security: 1.0, noise: 0.4, heat: 0.2, budget: 0.3, uv: 0.1 },
    fading: { uv: 1.0, heat: 0.5, budget: 0.4, noise: 0.1, security: 0.1 },
  };

  return mappings[painPoint]?.[productCategory] ?? 0.2;
}

/**
 * Scores how much the home's compass orientation benefits a product category.
 * West/South-facing homes get higher scores for heat and UV products.
 * @returns 0-1 relevance score
 */
function getOrientationScore(orientation: string, productCategory: string): number {
  // West and South facing boost heat-related products
  const heatBoostOrientations = ['west', 'south'];
  
  if (productCategory === 'heat') {
    if (heatBoostOrientations.includes(orientation)) return 1.0;
    if (orientation === 'east') return 0.7;
    return 0.4;
  }
  
  if (productCategory === 'uv') {
    if (heatBoostOrientations.includes(orientation)) return 0.9;
    return 0.5;
  }

  // Other categories aren't affected much by orientation
  return 0.5;
}

/**
 * Scores upgrade potential based on the user's current window type.
 * Single-pane homes benefit most from nearly every category.
 * @returns 0-1 relevance score
 */
function getStatusScore(currentStatus: string, productCategory: string): number {
  const mappings: Record<string, Record<string, number>> = {
    single: { heat: 1.0, budget: 1.0, noise: 0.8, security: 0.7, uv: 0.6 },
    double: { security: 0.9, noise: 0.8, heat: 0.6, uv: 0.7, budget: 0.3 },
    impact: { heat: 0.4, noise: 0.5, uv: 0.8, security: 0.2, budget: 0.1 },
    mixed: { budget: 0.8, heat: 0.7, noise: 0.6, security: 0.6, uv: 0.5 },
  };

  return mappings[currentStatus]?.[productCategory] ?? 0.5;
}

/**
 * Scores how well a product category aligns with the user's budget priority
 * (lowest cost, best value, fastest payback, or highest quality).
 * @returns 0-1 relevance score
 */
function getBudgetScore(budgetPriority: string, productCategory: string): number {
  const mappings: Record<string, Record<string, number>> = {
    lowest: { budget: 1.0, uv: 0.8, heat: 0.5, noise: 0.4, security: 0.3 },
    value: { heat: 0.9, security: 0.9, budget: 0.7, noise: 0.7, uv: 0.6 },
    payback: { heat: 1.0, budget: 0.8, uv: 0.7, security: 0.6, noise: 0.5 },
    quality: { security: 1.0, heat: 0.9, noise: 0.9, uv: 0.7, budget: 0.4 },
  };

  return mappings[budgetPriority]?.[productCategory] ?? 0.5;
}
