'use client';

import React, { useRef, useEffect, useState } from 'react';

export interface MarketData {
  _id: string;
  marketId: string;
  source: 'kalshi' | 'polymarket' | 'manifold';
  marketName: string;
  eventName: string;
  marketUrl: string;
  eventUrl?: string;
  description?: string;
  creationDate?: string;
  resolutionDate?: string;
  currentPrice: number;
  price1DayAgo?: number;
  price1WeekAgo?: number;
  price1MonthAgo?: number;
  priceChange1Day?: number;
  priceChange1Week?: number;
  priceChange1Month?: number;
}

interface MarketCardProps {
  market: MarketData;
  period: '1d' | '1w' | '1m';
  isExpanded: boolean;
  onToggleExpand: (marketId: string) => void;
  explanation?: string;
  explanationLoading?: boolean;
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

function getPriceChange(market: MarketData, period: '1d' | '1w' | '1m'): number | null {
  switch (period) {
    case '1d':
      return market.priceChange1Day ?? null;
    case '1w':
      return market.priceChange1Week ?? null;
    case '1m':
      return market.priceChange1Month ?? null;
  }
}

function getPriorPrice(market: MarketData, period: '1d' | '1w' | '1m'): number | null {
  switch (period) {
    case '1d':
      return market.price1DayAgo ?? null;
    case '1w':
      return market.price1WeekAgo ?? null;
    case '1m':
      return market.price1MonthAgo ?? null;
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MarketCard({ market, period, isExpanded, onToggleExpand, explanation, explanationLoading }: MarketCardProps) {
  const priceChange = getPriceChange(market, period);
  const priorPrice = getPriorPrice(market, period);
  const isPositive = priceChange !== null && priceChange >= 0;

  const expandedContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (expandedContentRef.current) {
      setContentHeight(expandedContentRef.current.scrollHeight);
    }
  }, [isExpanded, market]);

  const handleClick = () => {
    onToggleExpand(market._id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand(market._id);
    }
  };

  return (
    <div
      style={styles.card}
      className="screen"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
    >
      <div style={styles.row}>
        <div style={styles.mainContent}>
          <div style={styles.nameRow}>
            <span style={styles.marketName}>{market.marketName}</span>
            <span
              style={{
                ...styles.sourceBadge,
                backgroundColor: getSourceColor(market.source),
              }}
            >
              {getSourceLabel(market.source)}
            </span>
            <span style={{
              ...styles.expandIcon,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              ▼
            </span>
          </div>
        </div>

        <div style={styles.priceSection}>
          <div style={styles.priceRow}>
            <span style={styles.priceLabel}>Current</span>
            <span style={styles.currentPrice}>{market.currentPrice.toFixed(0)}¢</span>
          </div>
          <div style={styles.priceRow}>
            <span style={styles.priceLabel}>Prior</span>
            <span style={styles.priorPrice}>
              {priorPrice !== null ? `${priorPrice.toFixed(0)}¢` : '-'}
            </span>
          </div>
          <div style={styles.priceRow}>
            <span style={styles.priceLabel}>Change</span>
            <span
              style={{
                ...styles.priceChange,
                color: isPositive ? '#22C55E' : '#EF4444',
              }}
            >
              {priceChange !== null
                ? `${isPositive ? '+' : ''}${priceChange.toFixed(0)}%`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded content with smooth animation */}
      <div
        style={{
          ...styles.expandedWrapper,
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={expandedContentRef} style={styles.expandedContent}>
          <div style={styles.divider} />

          {/* AI Explanation */}
          <div style={styles.aiExplanationSection}>
            <span style={styles.aiLabel}>AI Analysis</span>
            {explanationLoading ? (
              <div style={styles.aiExplanationLoading}>
                <span style={styles.loadingDots}>Generating explanation...</span>
              </div>
            ) : explanation ? (
              <p style={styles.aiExplanation}>{explanation}</p>
            ) : (
              <p style={styles.aiExplanationEmpty}>No explanation available</p>
            )}
          </div>

          {market.description && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Description</span>
              <p style={styles.description}>{market.description}</p>
            </div>
          )}

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Event</span>
            <span style={styles.detailValue}>{market.eventName || '-'}</span>
          </div>

          <div style={styles.detailsGrid}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Created</span>
              <span style={styles.detailValue}>{formatDate(market.creationDate)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Resolves</span>
              <span style={styles.detailValue}>{formatDate(market.resolutionDate)}</span>
            </div>
          </div>

          <div style={styles.linksRow}>
            <a
              href={market.marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
              onClick={(e) => e.stopPropagation()}
            >
              View Market →
            </a>
            {market.eventUrl && (
              <a
                href={market.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
                onClick={(e) => e.stopPropagation()}
              >
                View Event →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },
  mainContent: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  marketName: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--etcha-charcoal)',
    lineHeight: 1.4,
  },
  sourceBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '4px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 600,
    color: 'white',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  expandIcon: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.5,
    transition: 'transform 0.3s ease',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  priceSection: {
    display: 'flex',
    gap: '20px',
    flexShrink: 0,
  },
  priceRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px',
  },
  priceLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  currentPrice: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--etcha-charcoal)',
  },
  priorPrice: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--etcha-charcoal)',
    opacity: 0.7,
  },
  priceChange: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '16px',
    fontWeight: 700,
  },
  expandedWrapper: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
  },
  expandedContent: {
    paddingTop: '16px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--etcha-charcoal)',
    opacity: 0.15,
    marginBottom: '16px',
  },
  detailRow: {
    marginBottom: '12px',
  },
  detailLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '4px',
  },
  detailValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--etcha-charcoal)',
    display: 'block',
  },
  description: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--etcha-charcoal)',
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  linksRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  link: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'var(--etcha-gold)',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '8px 12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(197, 163, 86, 0.1)',
    transition: 'background-color 0.2s ease',
  },
  aiExplanationSection: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'rgba(197, 163, 86, 0.08)',
    borderRadius: '6px',
    borderLeft: '3px solid var(--etcha-gold)',
  },
  aiLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: 'var(--etcha-gold)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
  },
  aiExplanation: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--etcha-charcoal)',
    lineHeight: 1.6,
    margin: 0,
  },
  aiExplanationLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  loadingDots: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.6,
    fontStyle: 'italic' as const,
  },
  aiExplanationEmpty: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.5,
    fontStyle: 'italic' as const,
    margin: 0,
  },
};
