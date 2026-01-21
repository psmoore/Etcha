import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Market, { IMarket } from '@/models/Market';

type Period = '1d' | '1w' | '1m';

interface MarketQuery {
  isExcluded: boolean;
  [key: string]: boolean | { $ne: null | undefined };
}

function getPriceChangeField(period: Period): keyof IMarket {
  switch (period) {
    case '1d':
      return 'priceChange1Day';
    case '1w':
      return 'priceChange1Week';
    case '1m':
      return 'priceChange1Month';
    default:
      return 'priceChange1Day';
  }
}

function getPriorPriceField(period: Period): keyof IMarket {
  switch (period) {
    case '1d':
      return 'price1DayAgo';
    case '1w':
      return 'price1WeekAgo';
    case '1m':
      return 'price1MonthAgo';
    default:
      return 'price1DayAgo';
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get period from query parameter, default to '1d'
    const searchParams = request.nextUrl.searchParams;
    const periodParam = searchParams.get('period');
    const period: Period =
      periodParam === '1w' || periodParam === '1m' ? periodParam : '1d';

    const priceChangeField = getPriceChangeField(period);
    const priorPriceField = getPriorPriceField(period);

    // Query for non-excluded markets that have a price change for the selected period
    // (meaning they existed at the prior time period)
    const query: MarketQuery = {
      isExcluded: false,
      [priceChangeField]: { $ne: null },
      [priorPriceField]: { $ne: null },
    };

    // Fetch markets and sort by absolute value of price change (descending)
    // MongoDB doesn't have a native absolute value sort, so we'll fetch and sort in memory
    let markets = await Market.find(query)
      .lean<IMarket[]>()
      .exec();

    // If no markets with price changes found, fall back to showing most recent markets
    let fallbackMode = false;
    if (markets.length === 0) {
      fallbackMode = true;
      markets = await Market.find({ isExcluded: false })
        .sort({ lastUpdated: -1 })
        .limit(20)
        .lean<IMarket[]>()
        .exec();
    }

    // Sort by absolute value of price change (descending) if not in fallback mode
    let sortedMarkets: IMarket[];
    if (fallbackMode) {
      sortedMarkets = markets;
    } else {
      sortedMarkets = markets.sort((a, b) => {
        const aChange = Math.abs(a[priceChangeField] as number || 0);
        const bChange = Math.abs(b[priceChangeField] as number || 0);
        return bChange - aChange;
      });
    }

    // Return top 20 markets
    const top20 = sortedMarkets.slice(0, 20);

    return NextResponse.json({
      markets: top20,
      period,
      total: top20.length,
      fallbackMode,
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
