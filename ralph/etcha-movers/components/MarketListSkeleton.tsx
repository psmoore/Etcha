'use client';

import React from 'react';

function SkeletonCard() {
  return (
    <div style={styles.card} className="screen">
      <div style={styles.row}>
        <div style={styles.mainContent}>
          <div style={styles.nameRow}>
            {/* Market name skeleton */}
            <div style={{ ...styles.skeleton, width: '60%', height: '18px' }} className="skeleton-pulse" />
            {/* Source badge skeleton */}
            <div style={{ ...styles.skeleton, width: '70px', height: '24px', borderRadius: '4px' }} className="skeleton-pulse" />
          </div>
        </div>

        <div style={styles.priceSection}>
          <div style={styles.priceRow}>
            <div style={{ ...styles.skeleton, width: '40px', height: '10px', marginBottom: '6px' }} className="skeleton-pulse" />
            <div style={{ ...styles.skeleton, width: '50px', height: '18px' }} className="skeleton-pulse" />
          </div>
          <div style={styles.priceRow}>
            <div style={{ ...styles.skeleton, width: '32px', height: '10px', marginBottom: '6px' }} className="skeleton-pulse" />
            <div style={{ ...styles.skeleton, width: '50px', height: '18px' }} className="skeleton-pulse" />
          </div>
          <div style={styles.priceRow}>
            <div style={{ ...styles.skeleton, width: '46px', height: '10px', marginBottom: '6px' }} className="skeleton-pulse" />
            <div style={{ ...styles.skeleton, width: '50px', height: '18px' }} className="skeleton-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketListSkeleton() {
  return (
    <div style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} />
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
  card: {
    marginBottom: '12px',
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
  skeleton: {
    backgroundColor: 'rgba(42, 42, 42, 0.12)',
    borderRadius: '4px',
  },
};
