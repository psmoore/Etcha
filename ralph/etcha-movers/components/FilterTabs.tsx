'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Period = '1d' | '1w' | '1m';

interface FilterTab {
  label: string;
  value: Period;
}

const tabs: FilterTab[] = [
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1w' },
  { label: '1 Month', value: '1m' },
];

export default function FilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPeriod = (searchParams.get('period') as Period) || '1d';

  const handleTabClick = (period: Period) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentPeriod === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => handleTabClick(tab.value)}
            style={{
              ...styles.tab,
              ...(isActive ? styles.activeTab : styles.inactiveTab),
            }}
            aria-pressed={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    gap: '8px',
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
  },
  tab: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    backgroundColor: 'var(--etcha-gold)',
    color: 'var(--etcha-charcoal)',
  },
  inactiveTab: {
    backgroundColor: 'transparent',
    color: 'var(--etcha-grey)',
  },
};
