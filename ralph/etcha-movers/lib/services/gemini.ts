import { GoogleGenAI } from '@google/genai';

export interface MarketForExplanation {
  marketId: string;
  marketName: string;
  description?: string;
  currentPrice: number;
  priceChange: number;
  source: string;
}

export interface ExplanationResult {
  marketId: string;
  explanation: string;
  error?: string;
}

const GEMINI_MODEL = 'gemini-3-flash-preview';

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

function getPeriodLabel(period: '1d' | '1w' | '1m'): string {
  switch (period) {
    case '1d':
      return 'the past day';
    case '1w':
      return 'the past week';
    case '1m':
      return 'the past month';
  }
}

function buildPrompt(market: MarketForExplanation, period: '1d' | '1w' | '1m'): string {
  const direction = market.priceChange >= 0 ? 'increased' : 'decreased';
  const periodLabel = getPeriodLabel(period);
  const absChange = Math.abs(market.priceChange);

  return `You are a prediction market analyst. Analyze this market and explain the most likely cause of the price change.

Market: ${market.marketName}
Source: ${market.source}
${market.description ? `Description: ${market.description}` : ''}

The probability has ${direction} by ${absChange} percentage points over ${periodLabel}.
Current price: ${market.currentPrice}% (representing the market's estimated probability of "Yes")

Provide a brief, insightful explanation (2-3 sentences) of the most likely real-world events or factors that caused this price movement. Focus on recent news, events, or developments that would explain why traders changed their probability estimates.

Do not mention the price change itself - focus on explaining WHY it happened based on likely real-world events.`;
}

export async function generateExplanation(
  market: MarketForExplanation,
  period: '1d' | '1w' | '1m'
): Promise<ExplanationResult> {
  try {
    const genai = getGenAI();
    const prompt = buildPrompt(market, period);

    const response = await genai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const explanation = response.text?.trim() || 'Unable to generate explanation.';

    return {
      marketId: market.marketId,
      explanation,
    };
  } catch (error) {
    console.error(`Error generating explanation for market ${market.marketId}:`, error);
    return {
      marketId: market.marketId,
      explanation: 'Unable to generate explanation at this time.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateExplanationsForMarkets(
  markets: MarketForExplanation[],
  period: '1d' | '1w' | '1m'
): Promise<ExplanationResult[]> {
  // Generate explanations for all markets in parallel
  const explanationPromises = markets.map((market) =>
    generateExplanation(market, period)
  );

  return Promise.all(explanationPromises);
}
