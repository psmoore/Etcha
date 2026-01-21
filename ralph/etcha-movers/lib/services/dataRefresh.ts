/**
 * Data refresh service
 *
 * Unified service to refresh all market data from all sources.
 * Fetches markets from Kalshi, Polymarket, and Manifold, stores historical
 * price snapshots, upserts market data, and calculates price changes.
 */

import dbConnect from '@/lib/mongodb';
import Market, { IMarket } from '@/models/Market';
import HistoricalPrice from '@/models/HistoricalPrice';
import { fetchKalshiMarkets, NormalizedMarket } from '@/lib/api/kalshi';
import { fetchPolymarketMarkets } from '@/lib/api/polymarket';
import { fetchManifoldMarkets } from '@/lib/api/manifold';

export interface RefreshResult {
  source: 'kalshi' | 'polymarket' | 'manifold';
  marketsUpdated: number;
  marketsAdded: number;
  errors: number;
}

export interface RefreshSummary {
  kalshi: RefreshResult;
  polymarket: RefreshResult;
  manifold: RefreshResult;
  totalMarketsUpdated: number;
  totalMarketsAdded: number;
  totalErrors: number;
  timestamp: Date;
}

/**
 * Store the current price of a market as a historical snapshot
 */
async function storeHistoricalSnapshot(
  marketId: string,
  source: 'kalshi' | 'polymarket' | 'manifold',
  price: number,
  timestamp: Date
): Promise<void> {
  await HistoricalPrice.create({
    marketId,
    source,
    price,
    timestamp,
  });
}

/**
 * Process markets from a single source using bulk operations
 *
 * @param markets - Array of normalized markets from the source
 * @param source - The source name for logging
 * @param now - Current timestamp for historical snapshots
 * @returns Result summary for this source
 */
async function processMarkets(
  markets: NormalizedMarket[],
  source: 'kalshi' | 'polymarket' | 'manifold',
  now: Date
): Promise<RefreshResult> {
  const result: RefreshResult = {
    source,
    marketsUpdated: 0,
    marketsAdded: 0,
    errors: 0,
  };

  if (markets.length === 0) {
    return result;
  }

  const BATCH_SIZE = 500;
  console.log(`Processing ${markets.length} ${source} markets in batches of ${BATCH_SIZE}...`);

  // Process in batches
  for (let i = 0; i < markets.length; i += BATCH_SIZE) {
    const batch = markets.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(markets.length / BATCH_SIZE);

    try {
      // Get all market IDs in this batch
      const marketIds = batch.map(m => m.marketId);

      // Fetch existing markets in one query
      const existingMarkets = await Market.find({
        marketId: { $in: marketIds },
        source: source,
      }).lean();

      const existingMap = new Map(
        existingMarkets.map(m => [m.marketId, m])
      );

      // Prepare bulk operations
      const bulkOps: Array<{
        updateOne: {
          filter: { marketId: string; source: string };
          update: { $set: Partial<IMarket> };
          upsert: boolean;
        };
      }> = [];

      // Prepare historical snapshots for existing markets
      const historicalSnapshots: Array<{
        marketId: string;
        source: 'kalshi' | 'polymarket' | 'manifold';
        price: number;
        timestamp: Date;
      }> = [];

      for (const market of batch) {
        const existing = existingMap.get(market.marketId);

        // Store historical snapshot for existing markets
        if (existing) {
          historicalSnapshots.push({
            marketId: existing.marketId,
            source: existing.source,
            price: existing.currentPrice,
            timestamp: now,
          });
        }

        // Prepare the market document for upsert
        const marketDoc: Partial<IMarket> = {
          marketId: market.marketId,
          source: market.source,
          marketName: market.marketName,
          eventName: market.eventName,
          marketUrl: market.marketUrl,
          eventUrl: market.eventUrl,
          description: market.description,
          creationDate: market.creationDate,
          resolutionDate: market.resolutionDate,
          currentPrice: market.currentPrice,
          category: market.category,
          lastUpdated: now,
        };

        bulkOps.push({
          updateOne: {
            filter: { marketId: market.marketId, source: market.source },
            update: { $set: marketDoc },
            upsert: true,
          },
        });
      }

      // Execute bulk historical snapshots
      if (historicalSnapshots.length > 0) {
        await HistoricalPrice.insertMany(historicalSnapshots, { ordered: false }).catch(err => {
          console.error(`Error inserting historical snapshots for ${source}:`, err.message);
        });
      }

      // Execute bulk market upserts
      if (bulkOps.length > 0) {
        const bulkResult = await Market.bulkWrite(bulkOps, { ordered: false });
        result.marketsUpdated += bulkResult.modifiedCount || 0;
        result.marketsAdded += bulkResult.upsertedCount || 0;
      }

      console.log(`  ${source} batch ${batchNum}/${totalBatches}: processed ${batch.length} markets`);
    } catch (error) {
      console.error(`Error processing ${source} batch ${batchNum}:`, error);
      result.errors += batch.length;
    }
  }

  console.log(`${source} complete: ${result.marketsAdded} added, ${result.marketsUpdated} updated, ${result.errors} errors`);
  return result;
}

/**
 * Refresh all market data from all sources
 *
 * Fetches markets from Kalshi, Polymarket, and Manifold in parallel,
 * stores historical price snapshots, upserts market data, and calculates
 * price changes.
 *
 * @returns Summary of markets updated/added per source
 */
export async function refreshAllMarkets(): Promise<RefreshSummary> {
  console.log('Starting market data refresh...');
  const now = new Date();

  // Ensure database connection
  await dbConnect();

  // Fetch from all sources in parallel
  console.log('Fetching markets from all sources...');
  const [kalshiMarkets, polymarketMarkets, manifoldMarkets] =
    await Promise.all([
      fetchKalshiMarkets().catch((error) => {
        console.error('Failed to fetch Kalshi markets:', error);
        return [] as NormalizedMarket[];
      }),
      fetchPolymarketMarkets().catch((error) => {
        console.error('Failed to fetch Polymarket markets:', error);
        return [] as NormalizedMarket[];
      }),
      fetchManifoldMarkets().catch((error) => {
        console.error('Failed to fetch Manifold markets:', error);
        return [] as NormalizedMarket[];
      }),
    ]);

  console.log(
    `Fetched: ${kalshiMarkets.length} Kalshi, ${polymarketMarkets.length} Polymarket, ${manifoldMarkets.length} Manifold markets`
  );

  // Process markets from each source
  console.log('Processing markets...');
  const [kalshiResult, polymarketResult, manifoldResult] = await Promise.all([
    processMarkets(kalshiMarkets, 'kalshi', now),
    processMarkets(polymarketMarkets, 'polymarket', now),
    processMarkets(manifoldMarkets, 'manifold', now),
  ]);

  const summary: RefreshSummary = {
    kalshi: kalshiResult,
    polymarket: polymarketResult,
    manifold: manifoldResult,
    totalMarketsUpdated:
      kalshiResult.marketsUpdated +
      polymarketResult.marketsUpdated +
      manifoldResult.marketsUpdated,
    totalMarketsAdded:
      kalshiResult.marketsAdded +
      polymarketResult.marketsAdded +
      manifoldResult.marketsAdded,
    totalErrors:
      kalshiResult.errors + polymarketResult.errors + manifoldResult.errors,
    timestamp: now,
  };

  console.log('Market data refresh complete:', {
    totalUpdated: summary.totalMarketsUpdated,
    totalAdded: summary.totalMarketsAdded,
    totalErrors: summary.totalErrors,
  });

  return summary;
}
