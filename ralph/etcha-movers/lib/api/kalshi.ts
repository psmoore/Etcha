/**
 * Kalshi API client for fetching market data
 *
 * API Documentation: https://docs.kalshi.com/api-reference/market/get-markets
 */

import { shouldExcludeMarket } from '../filters';

// Kalshi API base URL - uses elections subdomain but provides access to ALL markets
const KALSHI_API_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

// Rate limiting configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

// Types for Kalshi API response
interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  market_type: string;
  title: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  created_time: string;
  open_time?: string;
  close_time?: string;
  expiration_time?: string;
  status: string;
  yes_bid?: number;
  yes_ask?: number;
  last_price?: number;
  volume?: number;
  result?: string;
  rules_primary?: string;
  rules_secondary?: string;
  category?: string;
}

interface KalshiEvent {
  event_ticker: string;
  series_ticker?: string;
  title: string;
  sub_title?: string;
  category?: string;
}

interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor: string;
}

// Normalized market data for storage
export interface NormalizedMarket {
  marketId: string;
  source: 'kalshi' | 'polymarket' | 'manifold';
  marketName: string;
  eventName: string;
  marketUrl: string;
  eventUrl?: string;
  description?: string;
  creationDate?: Date;
  resolutionDate?: Date;
  currentPrice: number;
  category?: string;
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
          `Kalshi API rate limited or error (status ${response.status}), retrying in ${Math.round(delay)}ms...`
        );
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const delay = calculateBackoffDelay(attempt);
      console.warn(
        `Kalshi API request failed: ${lastError.message}, retrying in ${Math.round(delay)}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error('Failed to fetch from Kalshi API after retries');
}

/**
 * Get request headers with optional API key authentication
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Add API key if available (for higher rate limits)
  const apiKey = process.env.KALSHI_API_KEY;
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
}

/**
 * Fetch all markets from Kalshi with pagination
 */
async function fetchAllKalshiMarkets(): Promise<KalshiMarket[]> {
  const allMarkets: KalshiMarket[] = [];
  let cursor: string | undefined;
  const limit = 200; // Max 1000, but use smaller batch for reliability

  do {
    const params = new URLSearchParams({
      limit: limit.toString(),
      status: 'open', // Only fetch active/open markets
    });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const url = `${KALSHI_API_BASE_URL}/markets?${params.toString()}`;
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Kalshi API returned status ${response.status}: ${response.statusText}`
      );
    }

    const data: KalshiMarketsResponse = await response.json();
    allMarkets.push(...data.markets);

    cursor = data.cursor || undefined;

    // Safety limit to prevent infinite loops
    if (allMarkets.length >= 10000) {
      console.warn('Kalshi: Reached market limit of 10000, stopping pagination');
      break;
    }
  } while (cursor);

  return allMarkets;
}

/**
 * Fetch event details for a list of event tickers
 */
async function fetchEventDetails(
  eventTickers: string[]
): Promise<Map<string, KalshiEvent>> {
  const eventMap = new Map<string, KalshiEvent>();

  // De-duplicate event tickers
  const uniqueTickers = [...new Set(eventTickers)];

  // Fetch events in parallel with concurrency limit
  const CONCURRENT_REQUESTS = 5;

  for (let i = 0; i < uniqueTickers.length; i += CONCURRENT_REQUESTS) {
    const batch = uniqueTickers.slice(i, i + CONCURRENT_REQUESTS);

    const results = await Promise.allSettled(
      batch.map(async (ticker) => {
        const url = `${KALSHI_API_BASE_URL}/events/${ticker}`;
        const response = await fetchWithRetry(url, {
          method: 'GET',
          headers: getHeaders(),
        });

        if (!response.ok) {
          console.warn(
            `Failed to fetch event ${ticker}: ${response.status}`
          );
          return null;
        }

        const data = await response.json();
        return data.event as KalshiEvent;
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        eventMap.set(result.value.event_ticker, result.value);
      }
    }
  }

  return eventMap;
}

/**
 * Convert Kalshi market price to percentage (0-100)
 * Kalshi prices are in cents (0-100), so they directly map to percentage
 */
function normalizePrice(lastPrice: number | undefined): number {
  if (lastPrice === undefined || lastPrice === null) {
    return 50; // Default to 50% if no price
  }
  return lastPrice; // Already in cents (0-100 range)
}

/**
 * Build market URL from ticker
 */
function buildMarketUrl(ticker: string): string {
  return `https://kalshi.com/markets/${ticker}`;
}

/**
 * Build event URL from event ticker
 */
function buildEventUrl(eventTicker: string): string {
  return `https://kalshi.com/events/${eventTicker}`;
}

/**
 * Fetch markets from Kalshi API
 *
 * @returns Array of normalized market data
 */
export async function fetchKalshiMarkets(): Promise<NormalizedMarket[]> {
  console.log('Fetching markets from Kalshi...');

  // Fetch all open markets
  const markets = await fetchAllKalshiMarkets();
  console.log(`Kalshi: Fetched ${markets.length} raw markets`);

  // Skip fetching event details to avoid rate limiting
  // Market data already contains title and category info we need

  // Normalize and filter markets
  const normalizedMarkets: NormalizedMarket[] = [];

  for (const market of markets) {
    // Get market description from rules
    const description = market.rules_primary || market.rules_secondary || '';

    // Get category from market
    const category = market.category || '';

    // Filter out sports markets by checking ticker prefix
    // Kalshi sports tickers contain: SPORTS, NBA, NFL, MLB, NHL, etc.
    const ticker = market.ticker.toUpperCase();
    if (
      ticker.includes('SPORT') ||
      ticker.includes('NBA') ||
      ticker.includes('NFL') ||
      ticker.includes('MLB') ||
      ticker.includes('NHL') ||
      ticker.includes('SOCCER') ||
      ticker.includes('TENNIS') ||
      ticker.includes('GOLF')
    ) {
      continue;
    }

    // Apply additional category filter to exclude sports/price-threshold markets
    if (shouldExcludeMarket(market.title, description, category)) {
      continue;
    }

    const normalizedMarket: NormalizedMarket = {
      marketId: market.ticker,
      source: 'kalshi',
      marketName: market.title,
      eventName: market.event_ticker, // Use event ticker as event name
      marketUrl: buildMarketUrl(market.ticker),
      eventUrl: buildEventUrl(market.event_ticker),
      description: description || undefined,
      creationDate: market.created_time
        ? new Date(market.created_time)
        : undefined,
      resolutionDate: market.expiration_time
        ? new Date(market.expiration_time)
        : undefined,
      currentPrice: normalizePrice(market.last_price),
      category: category || undefined,
    };

    normalizedMarkets.push(normalizedMarket);
  }

  console.log(
    `Kalshi: Returning ${normalizedMarkets.length} markets after filtering`
  );

  return normalizedMarkets;
}
