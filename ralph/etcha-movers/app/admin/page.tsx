'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import NavHeader from '@/components/NavHeader';

// Toggle Switch Component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}

function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onChange();
    }
  };

  return (
    <div
      role="switch"
      aria-checked={!checked}
      aria-label={label}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onChange}
      onKeyDown={handleKeyDown}
      style={{
        ...toggleStyles.container,
        backgroundColor: checked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div
        style={{
          ...toggleStyles.thumb,
          transform: checked ? 'translateX(0)' : 'translateX(20px)',
          backgroundColor: checked ? '#EF4444' : '#22C55E',
        }}
      />
    </div>
  );
}

const toggleStyles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    padding: '2px',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  thumb: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    transition: 'transform 0.2s ease, background-color 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};

interface AdminMarket {
  _id: string;
  marketId: string;
  source: 'kalshi' | 'polymarket' | 'manifold';
  marketName: string;
  currentPrice: number;
  isExcluded: boolean;
  excludedBy?: string;
  excludedAt?: string;
  lastUpdated: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MarketsResponse {
  markets: AdminMarket[];
  pagination: PaginationInfo;
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'kalshi':
      return 'Kalshi';
    case 'polymarket':
      return 'Polymarket';
    case 'manifold':
      return 'Manifold';
    default:
      return source;
  }
}

function getSourceColor(source: string): string {
  switch (source) {
    case 'kalshi':
      return '#4A90A4';
    case 'polymarket':
      return '#7B61FF';
    case 'manifold':
      return '#11B981';
    default:
      return 'var(--etcha-charcoal)';
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Track which markets are being toggled (to show loading state)
  const [togglingMarkets, setTogglingMarkets] = useState<Set<string>>(new Set());

  // Track selected markets for bulk actions
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [bulkExcluding, setBulkExcluding] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when source filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sourceFilter]);

  // Fetch markets
  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (sourceFilter) params.set('source', sourceFilter);

      const response = await fetch(`/api/admin/markets?${params.toString()}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }

      const data: MarketsResponse = await response.json();
      setMarkets(data.markets);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, sourceFilter, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMarkets();
    }
  }, [status, fetchMarkets]);

  // Handle checkbox selection
  const handleSelectMarket = useCallback((marketId: string, checked: boolean) => {
    setSelectedMarkets((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(marketId);
      } else {
        next.delete(marketId);
      }
      return next;
    });
  }, []);

  // Handle select all on current page
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      // Select all non-excluded markets on current page
      const nonExcludedIds = markets.filter((m) => !m.isExcluded).map((m) => m._id);
      setSelectedMarkets(new Set(nonExcludedIds));
    } else {
      setSelectedMarkets(new Set());
    }
  }, [markets]);

  // Handle bulk exclude
  const handleBulkExclude = useCallback(async () => {
    if (selectedMarkets.size === 0) return;

    setBulkExcluding(true);

    // Get the list of selected market IDs
    const marketIds = Array.from(selectedMarkets);

    try {
      const response = await fetch('/api/admin/markets/bulk-exclude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marketIds }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to bulk exclude markets');
      }

      const data = await response.json();

      // Update local state to reflect exclusions
      setMarkets((prevMarkets) =>
        prevMarkets.map((m) =>
          selectedMarkets.has(m._id)
            ? { ...m, isExcluded: true }
            : m
        )
      );

      // Clear selection
      setSelectedMarkets(new Set());

      toast.success(data.message || `Excluded ${data.excludedCount} markets`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setBulkExcluding(false);
    }
  }, [selectedMarkets, router]);

  // Clear selection when filters or page changes
  useEffect(() => {
    setSelectedMarkets(new Set());
  }, [currentPage, debouncedSearch, sourceFilter]);

  // Handle toggling market exclusion
  const handleToggleExclusion = useCallback(async (market: AdminMarket) => {
    const marketId = market._id;
    const newExcludedState = !market.isExcluded;

    // Add to toggling set
    setTogglingMarkets((prev) => new Set(prev).add(marketId));

    // Optimistically update UI
    setMarkets((prevMarkets) =>
      prevMarkets.map((m) =>
        m._id === marketId ? { ...m, isExcluded: newExcludedState } : m
      )
    );

    try {
      const response = await fetch(`/api/admin/markets/${marketId}/exclude`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isExcluded: newExcludedState }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update market exclusion');
      }

      const data = await response.json();

      // Update with server response data
      setMarkets((prevMarkets) =>
        prevMarkets.map((m) =>
          m._id === marketId
            ? {
                ...m,
                isExcluded: data.market.isExcluded,
                excludedBy: data.market.excludedBy,
                excludedAt: data.market.excludedAt,
              }
            : m
        )
      );

      toast.success(
        newExcludedState
          ? `Excluded "${market.marketName.slice(0, 30)}${market.marketName.length > 30 ? '...' : ''}"`
          : `Included "${market.marketName.slice(0, 30)}${market.marketName.length > 30 ? '...' : ''}"`
      );
    } catch (err) {
      // Revert optimistic update on error
      setMarkets((prevMarkets) =>
        prevMarkets.map((m) =>
          m._id === marketId ? { ...m, isExcluded: !newExcludedState } : m
        )
      );

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      // Remove from toggling set
      setTogglingMarkets((prev) => {
        const next = new Set(prev);
        next.delete(marketId);
        return next;
      });
    }
  }, [router]);

  // Handle authentication loading and unauthenticated states
  if (status === 'loading') {
    return (
      <div style={styles.pageContainer}>
        <NavHeader />
        <main style={styles.main}>
          <div style={styles.loadingContainer} className="screen">
            <p style={styles.loadingText}>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div style={styles.pageContainer}>
      <NavHeader />
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin - Market Management</h1>
          <p style={styles.subtitle}>
            View and manage all markets across all sources
          </p>
        </div>

        {/* Filters */}
        <div style={styles.filtersContainer} className="screen">
          <div style={styles.filtersRow}>
            <div style={styles.searchContainer}>
              <label htmlFor="search" style={styles.filterLabel}>
                Search Markets
              </label>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by market name..."
                style={styles.searchInput}
              />
            </div>

            <div style={styles.sourceFilterContainer}>
              <label htmlFor="source" style={styles.filterLabel}>
                Source
              </label>
              <select
                id="source"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                style={styles.sourceSelect}
              >
                <option value="">All Sources</option>
                <option value="kalshi">Kalshi</option>
                <option value="polymarket">Polymarket</option>
                <option value="manifold">Manifold</option>
              </select>
            </div>
          </div>

          <div style={styles.resultsRow}>
            {pagination && (
              <div style={styles.resultsInfo}>
                Showing {markets.length} of {pagination.total} markets
              </div>
            )}

            {/* Bulk Exclude Button */}
            {selectedMarkets.size > 0 && (
              <button
                onClick={handleBulkExclude}
                disabled={bulkExcluding}
                style={{
                  ...styles.bulkExcludeButton,
                  opacity: bulkExcluding ? 0.7 : 1,
                  cursor: bulkExcluding ? 'not-allowed' : 'pointer',
                }}
              >
                {bulkExcluding ? (
                  <>
                    <span style={styles.spinner} />
                    Excluding...
                  </>
                ) : (
                  `Exclude Selected (${selectedMarkets.size})`
                )}
              </button>
            )}
          </div>
        </div>

        {/* Markets List */}
        {loading ? (
          <div style={styles.loadingContainer} className="screen">
            <p style={styles.loadingText}>Loading markets...</p>
          </div>
        ) : error ? (
          <div style={styles.errorContainer} className="screen">
            <p style={styles.errorText}>{error}</p>
            <button onClick={fetchMarkets} style={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : markets.length === 0 ? (
          <div style={styles.emptyContainer} className="screen">
            <p style={styles.emptyText}>No markets found</p>
            {(debouncedSearch || sourceFilter) && (
              <p style={styles.emptySubtext}>
                Try adjusting your search or filters
              </p>
            )}
          </div>
        ) : (
          <div style={styles.marketsContainer}>
            {/* Table Header */}
            <div style={styles.tableHeader} className="screen">
              <span style={{ ...styles.headerCell, width: '40px' }}>
                <input
                  type="checkbox"
                  checked={
                    markets.filter((m) => !m.isExcluded).length > 0 &&
                    markets.filter((m) => !m.isExcluded).every((m) => selectedMarkets.has(m._id))
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={styles.checkbox}
                  aria-label="Select all markets on this page"
                />
              </span>
              <span style={{ ...styles.headerCell, flex: 2 }}>Market Name</span>
              <span style={{ ...styles.headerCell, width: '100px' }}>Source</span>
              <span style={{ ...styles.headerCell, width: '80px', textAlign: 'right' as const }}>Price</span>
              <span style={{ ...styles.headerCell, width: '100px', textAlign: 'center' as const }}>Status</span>
              <span style={{ ...styles.headerCell, width: '80px', textAlign: 'center' as const }}>Toggle</span>
            </div>

            {/* Market Rows */}
            {markets.map((market) => (
              <div key={market._id} style={styles.marketRow} className="screen">
                <span style={{ ...styles.marketCell, width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedMarkets.has(market._id)}
                    onChange={(e) => handleSelectMarket(market._id, e.target.checked)}
                    disabled={market.isExcluded}
                    style={{
                      ...styles.checkbox,
                      opacity: market.isExcluded ? 0.3 : 1,
                      cursor: market.isExcluded ? 'not-allowed' : 'pointer',
                    }}
                    aria-label={`Select ${market.marketName}`}
                  />
                </span>
                <span style={{ ...styles.marketCell, flex: 2 }}>
                  <span style={styles.marketName}>{market.marketName}</span>
                </span>
                <span style={{ ...styles.marketCell, width: '100px' }}>
                  <span
                    style={{
                      ...styles.sourceBadge,
                      backgroundColor: getSourceColor(market.source),
                    }}
                  >
                    {getSourceLabel(market.source)}
                  </span>
                </span>
                <span style={{ ...styles.marketCell, width: '80px', textAlign: 'right' as const }}>
                  <span style={styles.priceText}>{market.currentPrice.toFixed(0)}¢</span>
                </span>
                <span style={{ ...styles.marketCell, width: '100px', textAlign: 'center' as const }}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: market.isExcluded
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(34, 197, 94, 0.15)',
                      color: market.isExcluded ? '#EF4444' : '#22C55E',
                    }}
                  >
                    {market.isExcluded ? 'Excluded' : 'Included'}
                  </span>
                </span>
                <span style={{ ...styles.marketCell, width: '80px', justifyContent: 'center' }}>
                  <ToggleSwitch
                    checked={market.isExcluded}
                    onChange={() => handleToggleExclusion(market)}
                    disabled={togglingMarkets.has(market._id)}
                    label={market.isExcluded ? 'Include market' : 'Exclude market'}
                  />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={styles.paginationContainer}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              style={{
                ...styles.paginationButton,
                opacity: pagination.hasPrev ? 1 : 0.5,
                cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
              }}
            >
              Previous
            </button>

            <span style={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext}
              style={{
                ...styles.paginationButton,
                opacity: pagination.hasNext ? 1 : 0.5,
                cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontFamily: "'Caveat', cursive",
    fontSize: '48px',
    color: 'var(--etcha-gold)',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    color: 'var(--etcha-grey)',
    margin: 0,
    opacity: 0.8,
  },
  filtersContainer: {
    marginBottom: '24px',
  },
  filtersRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginBottom: '12px',
  },
  searchContainer: {
    flex: 1,
    minWidth: '200px',
  },
  sourceFilterContainer: {
    width: '180px',
  },
  filterLabel: {
    display: 'block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: 'var(--etcha-charcoal)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
    opacity: 0.7,
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    border: '1px solid rgba(42, 42, 42, 0.2)',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: 'var(--etcha-charcoal)',
    outline: 'none',
  },
  sourceSelect: {
    width: '100%',
    padding: '10px 14px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    border: '1px solid rgba(42, 42, 42, 0.2)',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: 'var(--etcha-charcoal)',
    cursor: 'pointer',
    outline: 'none',
  },
  resultsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  resultsInfo: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.6,
  },
  bulkExcludeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: 600,
    transition: 'opacity 0.2s ease',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: 'var(--etcha-gold)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  },
  loadingText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.7,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
  },
  errorText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    color: '#EF4444',
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
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '8px',
  },
  emptyText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '16px',
    color: 'var(--etcha-charcoal)',
    fontWeight: 600,
    margin: 0,
  },
  emptySubtext: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.6,
    margin: 0,
  },
  marketsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 24px',
    backgroundColor: 'rgba(42, 42, 42, 0.05)',
  },
  headerCell: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--etcha-charcoal)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    opacity: 0.7,
  },
  marketRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    transition: 'background-color 0.2s ease',
  },
  marketCell: {
    display: 'flex',
    alignItems: 'center',
  },
  marketName: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--etcha-charcoal)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  sourceBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    fontWeight: 600,
    color: 'white',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  priceText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--etcha-charcoal)',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '4px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 600,
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
    padding: '16px',
  },
  paginationButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--etcha-gold)',
    color: 'var(--etcha-charcoal)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: 600,
    transition: 'opacity 0.2s ease',
  },
  pageInfo: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--etcha-grey)',
  },
};
