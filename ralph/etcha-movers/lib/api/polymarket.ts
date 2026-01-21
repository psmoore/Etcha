/**
 * Polymarket API client for fetching market data
 *
 * API Documentation: https://docs.polymarket.com/developers/gamma-markets-api/get-markets
 * Polymarket uses a Gamma API for market metadata and a CLOB API for pricing
 */

import { shouldExcludeMarket } from '../filters';
import { NormalizedMarket } from './kalshi';

// Polymarket API base URL
const GAMMA_API_BASE_URL = 'https://gamma-api.polymarket.com';

// Rate limiting configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

// Types for Polymarket API response
interface PolymarketMarket {
  id: string;
  slug: string;
  question: string;
  conditionId: string;
  description?: string;
  category?: string;
  marketType?: string;
  outcomes: string[];
  outcomePrices: string[];
  createdAt: string;
  endDate?: string;
  startDate?: string;
  active: boolean;
  closed: boolean;
  acceptingOrders: boolean;
  enableOrderBook: boolean;
  volume?: string;
  volumeNum?: number;
  liquidity?: string;
  liquidityNum?: number;
}

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  active: boolean;
  closed: boolean;
  markets: PolymarketMarket[];
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

/**
 * Fetch with exponential backoff retry for rate limiting
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting (429) and server errors (5xx)
      if (response.status === 429 || response.status >= 500) {
        const delay = calculateBackoffDelay(attempt);
        console.warn(
          `Polymarket API rate limited or error (status ${response.status}), retrying in ${Math.round(delay)}ms...`
        );
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const delay = calculateBackoffDelay(attempt);
      console.warn(
        `Polymarket API request failed: ${lastError.message}, retrying in ${Math.round(delay)}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error('Failed to fetch from Polymarket API after retries');
}

/**
 * Get request headers for Polymarket API (no auth required for public endpoints)
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Fetch all active events with their markets from Polymarket
 */
async function fetchAllPolymarketEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];
  let offset = 0;
  const limit = 100; // Reasonable batch size

  do {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      active: 'true',
      closed: 'false',
    });

    const url = `${GAMMA_API_BASE_URL}/events?${params.toString()}`;
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Polymarket API returned status ${response.status}: ${response.statusText}`
      );
    }

    const events: PolymarketEvent[] = await response.json();

    if (events.length === 0) {
      break; // No more events
    }

    allEvents.push(...events);
    offset += limit;

    // Safety limit to prevent infinite loops
    if (allEvents.length >= 5000) {
      console.warn('Polymarket: Reached event limit of 5000, stopping pagination');
      break;
    }
  } while (true);

  return allEvents;
}

/**
 * Build market URL from slug
 */
function buildMarketUrl(slug: string): string {
  return `https://polymarket.com/event/${slug}`;
}

/**
 * Build event URL from slug (same as market URL for Polymarket)
 */
function buildEventUrl(slug: string): string {
  return `https://polymarket.com/event/${slug}`;
}

/**
 * Parse outcome price to percentage (0-100)
 * Polymarket prices are strings representing decimals (e.g., "0.65" = 65%)
 */
function parseOutcomePrice(priceStr: string | undefined): number {
  if (!priceStr) {
    return 50; // Default to 50% if no price
  }
  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    return 50;
  }
  // Convert from decimal (0-1) to percentage (0-100)
  return Math.round(price * 100);
}

/**
 * Get the "Yes" outcome price from a binary market
 * Polymarket markets typically have "Yes" and "No" outcomes
 */
function getYesPrice(market: PolymarketMarket): number {
  const yesIndex = market.outcomes.findIndex(
    (o) => o.toLowerCase() === 'yes'
  );

  if (yesIndex >= 0 && market.outcomePrices[yesIndex]) {
    return parseOutcomePrice(market.outcomePrices[yesIndex]);
  }

  // If no "Yes" outcome, use first outcome price
  if (market.outcomePrices.length > 0) {
    return parseOutcomePrice(market.outcomePrices[0]);
  }

  return 50;
}

/**
 * Fetch markets from Polymarket API
 *
 * @returns Array of normalized market data
 */
export async function fetchPolymarketMarkets(): Promise<NormalizedMarket[]> {
  console.log('Fetching markets from Polymarket...');

  // Fetch all active events
  const events = await fetchAllPolymarketEvents();
  console.log(`Polymarket: Fetched ${events.length} events`);

  // Normalize and filter markets from events
  const normalizedMarkets: NormalizedMarket[] = [];

  for (const event of events) {
    // Skip events without markets
    if (!event.markets || event.markets.length === 0) {
      continue;
    }

    for (const market of event.markets) {
      // Only include markets that are active and accepting orders
      if (!market.active || market.closed || !market.enableOrderBook) {
        continue;
      }

      // Get description from market or event
      const description = market.description || event.description || '';

      // Get category from market or event
      const category = market.category || event.category || '';

      // Apply category filter to exclude sports/price-threshold markets
      if (shouldExcludeMarket(market.question, description, category)) {
        continue;
      }

      const normalizedMarket: NormalizedMarket = {
        marketId: market.conditionId,
        source: 'polymarket',
        marketName: market.question,
        eventName: event.title,
        marketUrl: buildMarketUrl(event.slug),
        eventUrl: buildEventUrl(event.slug),
        description: description || undefined,
        creationDate: market.createdAt ? new Date(market.createdAt) : undefined,
        resolutionDate: market.endDate ? new Date(market.endDate) : undefined,
        currentPrice: getYesPrice(market),
        category: category || undefined,
      };

      normalizedMarkets.push(normalizedMarket);
    }
  }

  console.log(
    `Polymarket: Returning ${normalizedMarkets.length} markets after filtering`
  );

  return normalizedMarkets;
}
