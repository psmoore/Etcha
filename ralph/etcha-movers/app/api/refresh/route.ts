import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { refreshAllMarkets } from '@/lib/services/dataRefresh';

export async function POST() {
  try {
    // TEMPORARY: Auth disabled for testing
    /*
    // Check authentication - return 401 if not logged in
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    */

    // Call the data refresh service
    const summary = await refreshAllMarkets();

    // Return JSON with counts
    return NextResponse.json({
      marketsUpdated: summary.totalMarketsUpdated,
      marketsAdded: summary.totalMarketsAdded,
      errors: summary.totalErrors,
      timestamp: summary.timestamp,
      details: {
        kalshi: summary.kalshi,
        polymarket: summary.polymarket,
        manifold: summary.manifold,
      },
    });
  } catch (error) {
    console.error('Error refreshing market data:', error);
    return NextResponse.json(
      { error: 'Failed to refresh market data' },
      { status: 500 }
    );
  }
}
