/**
 * Netlify Scheduled Function: Daily Market Refresh
 *
 * Runs automatically at 4am Pacific (12:00 UTC) daily to refresh
 * all market data from Kalshi, Polymarket, and Manifold.
 */

import { Config } from '@netlify/functions';
import { refreshAllMarkets, RefreshSummary } from '../../lib/services/dataRefresh';

export default async function handler(): Promise<Response> {
  console.log('Scheduled market refresh starting...');
  const startTime = Date.now();

  try {
    const summary: RefreshSummary = await refreshAllMarkets();

    const duration = Date.now() - startTime;
    console.log('Scheduled market refresh completed successfully', {
      duration: `${duration}ms`,
      totalUpdated: summary.totalMarketsUpdated,
      totalAdded: summary.totalMarketsAdded,
      totalErrors: summary.totalErrors,
      kalshi: summary.kalshi,
      polymarket: summary.polymarket,
      manifold: summary.manifold,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Market refresh completed',
        summary,
        duration: `${duration}ms`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Scheduled market refresh failed', {
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Market refresh failed',
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Schedule configuration: 4am Pacific = 12:00 UTC
// Cron expression: minute hour day-of-month month day-of-week
export const config: Config = {
  schedule: '0 12 * * *',
};
