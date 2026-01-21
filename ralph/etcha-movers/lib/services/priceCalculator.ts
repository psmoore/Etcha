/**
 * Price change calculation service
 *
 * Calculates price changes for markets based on historical price data.
 * Price changes are stored as percentage points (e.g., +32, -59).
 */

import HistoricalPrice from '@/models/HistoricalPrice';

// Time period constants in milliseconds
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;
const ONE_MONTH_MS = 30 * ONE_DAY_MS;

// Tolerance for finding historical prices (4 hours)
const TIME_TOLERANCE_MS = 4 * 60 * 60 * 1000;

export interface MarketWithPrices {
  marketId: string;
  source: 'kalshi' | 'polymarket' | 'manifold';
  currentPrice: number;
  creationDate?: Date;
}

export interface PriceChanges {
  price1DayAgo: number | null;
  price1WeekAgo: number | null;
  price1MonthAgo: number | null;
  priceChange1Day: number | null;
  priceChange1Week: number | null;
  priceChange1Month: number | null;
}

export interface MarketWithPriceChanges extends MarketWithPrices, PriceChanges {}

/**
 * Find the closest historical price to a target timestamp
 *
 * @param marketId - The market ID to look up
 * @param source - The market source (kalshi, polymarket, manifold)
 * @param targetTimestamp - The target timestamp to find historical price for
 * @param tolerance - Maximum time difference allowed (default 4 hours)
 * @returns The historical price or null if not found within tolerance
 */
async function findHistoricalPrice(
  marketId: string,
  source: 'kalshi' | 'polymarket' | 'manifold',
  targetTimestamp: Date,
  tolerance: number = TIME_TOLERANCE_MS
): Promise<number | null> {
  const minTime = new Date(targetTimestamp.getTime() - tolerance);
  const maxTime = new Date(targetTimestamp.getTime() + tolerance);

  // Find the closest price within the tolerance window
  const historicalPrice = await HistoricalPrice.findOne({
    marketId,
    source,
    timestamp: { $gte: minTime, $lte: maxTime },
  })
    .sort({ timestamp: -1 }) // Get the most recent one within the window
    .lean();

  return historicalPrice ? historicalPrice.price : null;
}

/**
 * Check if a market existed at a given time based on its creation date
 *
 * @param market - The market to check
 * @param targetTimestamp - The timestamp to check against
 * @returns True if the market existed at the target time
 */
function marketExistedAt(market: MarketWithPrices, targetTimestamp: Date): boolean {
  if (!market.creationDate) {
    // If no creation date, assume the market has always existed
    return true;
  }
  return market.creationDate.getTime() <= targetTimestamp.getTime();
}

/**
 * Calculate price change as percentage points
 *
 * @param currentPrice - Current price (0-100)
 * @param priorPrice - Prior price (0-100)
 * @returns Price change in percentage points (e.g., +32, -59)
 */
function calculatePriceChange(
  currentPrice: number,
  priorPrice: number | null
): number | null {
  if (priorPrice === null) {
    return null;
  }
  // Round to avoid floating point precision issues
  return Math.round(currentPrice - priorPrice);
}

/**
 * Calculate price changes for a single market
 *
 * @param market - The market to calculate price changes for
 * @param now - The reference timestamp (default: current time)
 * @returns Price changes for 1 day, 1 week, and 1 month periods
 */
export async function calculatePriceChangesForMarket(
  market: MarketWithPrices,
  now: Date = new Date()
): Promise<PriceChanges> {
  const oneDayAgo = new Date(now.getTime() - ONE_DAY_MS);
  const oneWeekAgo = new Date(now.getTime() - ONE_WEEK_MS);
  const oneMonthAgo = new Date(now.getTime() - ONE_MONTH_MS);

  // Initialize results
  let price1DayAgo: number | null = null;
  let price1WeekAgo: number | null = null;
  let price1MonthAgo: number | null = null;

  // Only look up historical prices if the market existed at that time
  if (marketExistedAt(market, oneDayAgo)) {
    price1DayAgo = await findHistoricalPrice(
      market.marketId,
      market.source,
      oneDayAgo
    );
  }

  if (marketExistedAt(market, oneWeekAgo)) {
    price1WeekAgo = await findHistoricalPrice(
      market.marketId,
      market.source,
      oneWeekAgo
    );
  }

  if (marketExistedAt(market, oneMonthAgo)) {
    price1MonthAgo = await findHistoricalPrice(
      market.marketId,
      market.source,
      oneMonthAgo
    );
  }

  return {
    price1DayAgo,
    price1WeekAgo,
    price1MonthAgo,
    priceChange1Day: calculatePriceChange(market.currentPrice, price1DayAgo),
    priceChange1Week: calculatePriceChange(market.currentPrice, price1WeekAgo),
    priceChange1Month: calculatePriceChange(market.currentPrice, price1MonthAgo),
  };
}

/**
 * Calculate price changes for multiple markets
 *
 * @param markets - Array of markets to calculate price changes for
 * @param now - The reference timestamp (default: current time)
 * @returns Array of markets with calculated price changes
 */
export async function calculatePriceChanges(
  markets: MarketWithPrices[],
  now: Date = new Date()
): Promise<MarketWithPriceChanges[]> {
  const results: MarketWithPriceChanges[] = [];

  // Process markets in parallel with a concurrency limit
  const BATCH_SIZE = 10;

  for (let i = 0; i < markets.length; i += BATCH_SIZE) {
    const batch = markets.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (market) => {
        const priceChanges = await calculatePriceChangesForMarket(market, now);
        return {
          ...market,
          ...priceChanges,
        };
      })
    );

    results.push(...batchResults);
  }

  return results;
}
