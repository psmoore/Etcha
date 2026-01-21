/**
 * Manifold Markets API client for fetching market data
 *
 * API Documentation: https://docs.manifold.markets/api
 * Manifold uses a public REST API with no authentication required
 */

import { shouldExcludeMarket } from '../filters';
import { NormalizedMarket } from './kalshi';

// Manifold API base URL
const MANIFOLD_API_BASE_URL = 'https://api.manifold.markets';

// Rate limiting configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

// Types for Manifold API response
interface ManifoldMarket {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorName: string;
  createdTime: number; // Unix timestamp in ms
  closeTime?: number; // Unix timestamp in ms
  question: string;
  url: string;
  outcomeType: 'BINARY' | 'PSEUDO_NUMERIC' | 'FREE_RESPONSE' | 'MULTIPLE_CHOICE' | 'NUMERIC' | 'CERT' | 'QUADRATIC_FUNDING' | 'STONK' | 'BOUNTIED_QUESTION' | 'POLL';
  mechanism: string;
  probability?: number; // For BINARY markets, 0-1
  pool?: Record<string, number>;
  totalLiquidity?: number;
  volume: number;
  volume24Hours?: number;
  isResolved: boolean;
  resolution?: string;
  resolutionTime?: number;
  uniqueBettorCount?: number;
  coverImageUrl?: string;
  groupSlugs?: string[];
  textDescription?: string;
  description?: string | object;
}

interface ManifoldGroup {
  id: string;
  slug: string;
  name: string;
  about?: string;
  creatorId: string;
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
          `Manifold API rate limited or error (status ${response.status}), retrying in ${Math.round(delay)}ms...`
        );
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const delay = calculateBackoffDelay(attempt);
      console.warn(
        `Manifold API request failed: ${lastError.message}, retrying in ${Math.round(delay)}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error('Failed to fetch from Manifold API after retries');
}

/**
 * Get request headers for Manifold API (no auth required for public endpoints)
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Fetch all active markets from Manifold with pagination
 */
async function fetchAllManifoldMarkets(): Promise<ManifoldMarket[]> {
  const allMarkets: ManifoldMarket[] = [];
  let before: string | undefined;
  const limit = 500; // Max is 1000, default is 500

  do {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (before) {
      params.set('before', before);
    }

    const url = `${MANIFOLD_API_BASE_URL}/v0/markets?${params.toString()}`;
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Manifold API returned status ${response.status}: ${response.statusText}`
      );
    }

    const markets: ManifoldMarket[] = await response.json();

    if (markets.length === 0) {
      break; // No more markets
    }

    // Filter for active binary markets only (that have probability)
    const activeMarkets = markets.filter(
      (m) =>
        !m.isResolved &&
        m.outcomeType === 'BINARY' &&
        m.probability !== undefined
    );

    allMarkets.push(...activeMarkets);

    // Get the last market ID for cursor-based pagination
    before = markets[markets.length - 1]?.id;

    // Safety limit to prevent infinite loops
    if (allMarkets.length >= 10000) {
      console.warn('Manifold: Reached market limit of 10000, stopping pagination');
      break;
    }

    // If we got less than limit, we've reached the end
    if (markets.length < limit) {
      break;
    }
  } while (true);

  return allMarkets;
}

/**
 * Fetch group details for a list of group slugs
 */
async function fetchGroupDetails(
  groupSlugs: string[]
): Promise<Map<string, ManifoldGroup>> {
  const groupMap = new Map<string, ManifoldGroup>();

  // De-duplicate group slugs
  const uniqueSlugs = [...new Set(groupSlugs)];

  // Fetch groups in parallel with concurrency limit
  const CONCURRENT_REQUESTS = 5;

  for (let i = 0; i < uniqueSlugs.length; i += CONCURRENT_REQUESTS) {
    const batch = uniqueSlugs.slice(i, i + CONCURRENT_REQUESTS);

    const results = await Promise.allSettled(
      batch.map(async (slug) => {
        const url = `${MANIFOLD_API_BASE_URL}/v0/group/${slug}`;
        const response = await fetchWithRetry(url, {
          method: 'GET',
          headers: getHeaders(),
        });

        if (!response.ok) {
          // Group endpoint may not exist, just skip
          return null;
        }

        const group: ManifoldGroup = await response.json();
        return group;
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        groupMap.set(result.value.slug, result.value);
      }
    }
  }

  return groupMap;
}

/**
 * Convert Manifold probability to percentage (0-100)
 * Manifold probabilities are decimals (0-1)
 */
function normalizePrice(probability: number | undefined): number {
  if (probability === undefined || probability === null) {
    return 50; // Default to 50% if no probability
  }
  return Math.round(probability * 100);
}

/**
 * Get description text from Manifold market
 * Description can be a string or a JSON object (TipTap format)
 */
function getDescriptionText(market: ManifoldMarket): string {
  // First try textDescription which is plain text
  if (market.textDescription) {
    return market.textDescription;
  }

  // If description is a string, use it
  if (typeof market.description === 'string') {
    return market.description;
  }

  // If description is an object (TipTap JSON), we skip it as parsing is complex
  return '';
}

/**
 * Get the primary group/category name from market
 */
function getPrimaryGroupName(
  market: ManifoldMarket,
  groupMap: Map<string, ManifoldGroup>
): string {
  if (!market.groupSlugs || market.groupSlugs.length === 0) {
    return 'General';
  }

  // Get the first group that exists in our map
  for (const slug of market.groupSlugs) {
    const group = groupMap.get(slug);
    if (group) {
      return group.name;
    }
  }

  // Return the first slug if we couldn't fetch group details
  return market.groupSlugs[0];
}

/**
 * Fetch markets from Manifold Markets API
 *
 * @returns Array of normalized market data
 */
export async function fetchManifoldMarkets(): Promise<NormalizedMarket[]> {
  console.log('Fetching markets from Manifold...');

  // Fetch all active binary markets
  const markets = await fetchAllManifoldMarkets();
  console.log(`Manifold: Fetched ${markets.length} active binary markets`);

  // Collect all unique group slugs
  const allGroupSlugs: string[] = [];
  for (const market of markets) {
    if (market.groupSlugs) {
      allGroupSlugs.push(...market.groupSlugs);
    }
  }

  // Fetch group details (for event names)
  const groupMap = await fetchGroupDetails(allGroupSlugs);
  console.log(`Manifold: Fetched ${groupMap.size} group details`);

  // Normalize and filter markets
  const normalizedMarkets: NormalizedMarket[] = [];

  for (const market of markets) {
    // Get description
    const description = getDescriptionText(market);

    // Get primary group/category name
    const groupName = getPrimaryGroupName(market, groupMap);

    // Apply category filter to exclude sports/price-threshold markets
    if (shouldExcludeMarket(market.question, description, groupName)) {
      continue;
    }

    const normalizedMarket: NormalizedMarket = {
      marketId: market.id,
      source: 'manifold',
      marketName: market.question,
      eventName: groupName,
      marketUrl: market.url,
      eventUrl: undefined, // Manifold doesn't have separate event pages
      description: description || undefined,
      creationDate: market.createdTime
        ? new Date(market.createdTime)
        : undefined,
      resolutionDate: market.closeTime
        ? new Date(market.closeTime)
        : undefined,
      currentPrice: normalizePrice(market.probability),
      category: groupName || undefined,
    };

    normalizedMarkets.push(normalizedMarket);
  }

  console.log(
    `Manifold: Returning ${normalizedMarkets.length} markets after filtering`
  );

  return normalizedMarkets;
}
