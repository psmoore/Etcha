'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import MarketCard, { MarketData } from './MarketCard';
import MarketListSkeleton from './MarketListSkeleton';
import EmptyState from './EmptyState';

type Period = '1d' | '1w' | '1m';

interface MarketsResponse {
  markets: MarketData[];
  period: Period;
  total: number;
}

interface ExplanationResult {
  marketId: string;
  explanation: string;
  error?: string;
}

interface ExplanationsResponse {
  explanations: ExplanationResult[];
  period: Period;
  total: number;
}

function getPriceChange(market: MarketData, period: Period): number {
  switch (period) {
    case '1d':
      return market.priceChange1Day ?? 0;
    case '1w':
      return market.priceChange1Week ?? 0;
    case '1m':
      return market.priceChange1Month ?? 0;
  }
}

export default function MarketList() {
  const searchParams = useSearchParams();
  const period = (searchParams.get('period') as Period) || '1d';

  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMarketId, setExpandedMarketId] = useState<string | null>(null);

  // AI explanations state
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explanationsLoading, setExplanationsLoading] = useState(false);

  const handleToggleExpand = (marketId: string) => {
    setExpandedMarketId((prev) => (prev === marketId ? null : marketId));
  };

  // Fetch markets function (memoized for retry button)
  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpandedMarketId(null); // Reset expanded card when period changes
    setExplanations({}); // Reset explanations when period changes

    try {
      const response = await fetch(`/api/markets?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }

      const data: MarketsResponse = await response.json();
      setMarkets(data.markets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Fetch markets on mount and period change
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Fetch explanations when markets are loaded
  // Use a stable key based on market IDs to prevent re-fetching
  const marketIdsKey = markets.map((m) => m.marketId).sort().join(',');

  useEffect(() => {
    async function fetchExplanations() {
      if (markets.length === 0) return;

      // Skip if we already have explanations for these markets
      const hasAllExplanations = markets.every((m) => explanations[m.marketId]);
      if (hasAllExplanations) return;

      setExplanationsLoading(true);

      try {
        const marketsPayload = markets.map((market) => ({
          marketId: market.marketId,
          marketName: market.marketName,
          description: market.description,
          currentPrice: market.currentPrice,
          priceChange: getPriceChange(market, period),
          source: market.source,
        }));

        const response = await fetch('/api/explanations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markets: marketsPayload, period }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate AI explanations');
        }

        const data: ExplanationsResponse = await response.json();

        // Convert explanations array to a map by marketId
        const explanationsMap: Record<string, string> = {};
        data.explanations.forEach((exp) => {
          explanationsMap[exp.marketId] = exp.explanation;
        });

        setExplanations(explanationsMap);
      } catch (err) {
        // Show error toast for explanations failure (non-blocking)
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate explanations';
        toast.error(errorMessage);
        console.error('Error fetching explanations:', err);
      } finally {
        setExplanationsLoading(false);
      }
    }

    fetchExplanations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketIdsKey, period]);

  if (loading) {
    return <MarketListSkeleton />;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer} className="screen">
          <div style={styles.errorText}>{error}</div>
          <button
            onClick={fetchMarkets}
            style={styles.retryButton}
            aria-label="Retry fetching markets"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div style={styles.container}>
        <EmptyState period={period} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {markets.map((market) => (
        <MarketCard
          key={market._id}
          market={market}
          period={period}
          isExpanded={expandedMarketId === market._id}
          onToggleExpand={handleToggleExpand}
          explanation={explanations[market.marketId]}
          explanationLoading={explanationsLoading}
        />
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '0 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '16px',
  },
  errorText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    color: '#EF4444',
    textAlign: 'center' as const,
  },
  retryButton: {
    padding: '10px 24px',
    backgroundColor: 'var(--etcha-gold)',
    color: 'var(--etcha-charcoal)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
