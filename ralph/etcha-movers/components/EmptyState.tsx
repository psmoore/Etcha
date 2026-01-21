'use client';

import React from 'react';

interface EmptyStateProps {
  period?: '1d' | '1w' | '1m';
}

function getPeriodLabel(period: string): string {
  switch (period) {
    case '1d':
      return '1 Day';
    case '1w':
      return '1 Week';
    case '1m':
      return '1 Month';
    default:
      return 'this';
  }
}

function getSuggestions(period: string): string[] {
  const suggestions: string[] = [];
  if (period !== '1d') suggestions.push('1 Day');
  if (period !== '1w') suggestions.push('1 Week');
  if (period !== '1m') suggestions.push('1 Month');
  return suggestions;
}

export default function EmptyState({ period = '1d' }: EmptyStateProps) {
  const periodLabel = getPeriodLabel(period);
  const suggestions = getSuggestions(period);

  return (
    <div className="screen" style={styles.container}>
      <div style={styles.iconContainer}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--etcha-charcoal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={styles.icon}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <h3 style={styles.title}>No markets found for this time period</h3>
      <p style={styles.description}>
        There are no markets with significant price changes in the {periodLabel} period.
      </p>
      <div style={styles.suggestionContainer}>
        <p style={styles.suggestionLabel}>Try a different time period:</p>
        <div style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <span key={suggestion} style={styles.suggestionBadge}>
              {suggestion}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  iconContainer: {
    marginBottom: '16px',
    opacity: 0.5,
  },
  icon: {
    opacity: 0.7,
  },
  title: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--etcha-charcoal)',
    margin: '0 0 12px 0',
  },
  description: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.7,
    margin: '0 0 24px 0',
    lineHeight: 1.5,
  },
  suggestionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  suggestionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.6,
    margin: 0,
  },
  suggestions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestionBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    padding: '6px 12px',
    backgroundColor: 'var(--etcha-gold)',
    color: 'white',
    borderRadius: '16px',
    fontWeight: 500,
  },
};
