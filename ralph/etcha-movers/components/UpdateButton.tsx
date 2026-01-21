'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function UpdateButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please log in');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to refresh data');
      }

      const data = await response.json();
      const { marketsUpdated, marketsAdded } = data;
      toast.success(
        `Data refreshed: ${marketsUpdated} updated, ${marketsAdded} added`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to refresh data';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      style={{
        ...styles.button,
        ...(isLoading ? styles.buttonDisabled : {}),
      }}
      aria-busy={isLoading}
      aria-label={isLoading ? 'Updating data...' : 'Update data'}
    >
      {isLoading ? (
        <>
          <span style={styles.spinner} aria-hidden="true" />
          <span>Updating...</span>
        </>
      ) : (
        <span>Update Data</span>
      )}
    </button>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
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
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTopColor: 'var(--etcha-charcoal)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
