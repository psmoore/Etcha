import { NextRequest, NextResponse } from 'next/server';
import { generateExplanationsForMarkets, MarketForExplanation } from '@/lib/services/gemini';

type Period = '1d' | '1w' | '1m';

interface MarketPayload {
  marketId: string;
  marketName: string;
  description?: string;
  currentPrice: number;
  priceChange: number;
  source: string;
}

interface RequestBody {
  markets: MarketPayload[];
  period: Period;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!body.markets || !Array.isArray(body.markets)) {
      return NextResponse.json(
        { error: 'markets array is required' },
        { status: 400 }
      );
    }

    if (!body.period || !['1d', '1w', '1m'].includes(body.period)) {
      return NextResponse.json(
        { error: 'period must be 1d, 1w, or 1m' },
        { status: 400 }
      );
    }

    // Limit to 20 markets max to prevent overloading
    const marketsToProcess = body.markets.slice(0, 20);

    // Convert to MarketForExplanation format
    const marketsForExplanation: MarketForExplanation[] = marketsToProcess.map((m) => ({
      marketId: m.marketId,
      marketName: m.marketName,
      description: m.description,
      currentPrice: m.currentPrice,
      priceChange: m.priceChange,
      source: m.source,
    }));

    // Generate explanations for all markets in parallel
    const explanations = await generateExplanationsForMarkets(
      marketsForExplanation,
      body.period
    );

    return NextResponse.json({
      explanations,
      period: body.period,
      total: explanations.length,
    });
  } catch (error) {
    console.error('Error generating explanations:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanations' },
      { status: 500 }
    );
  }
}
