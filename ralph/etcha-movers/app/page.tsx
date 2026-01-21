'use client';

import { Suspense } from 'react';
import NavHeader from '@/components/NavHeader';
import FilterTabs from '@/components/FilterTabs';
import UpdateButton from '@/components/UpdateButton';
import MarketList from '@/components/MarketList';
import MarketListSkeleton from '@/components/MarketListSkeleton';
import Dials from '@/components/Dials';

export default function Home() {
  return (
    <main style={styles.main}>
      {/* Navigation Header */}
      <NavHeader />

      {/* Controls Section: Filter Tabs and Update Button */}
      <section style={styles.controlsSection}>
        <div style={styles.controlsContainer}>
          <Suspense fallback={<div style={styles.filterPlaceholder} />}>
            <FilterTabs />
          </Suspense>
          <UpdateButton />
        </div>
      </section>

      {/* Market List */}
      <section style={styles.marketSection}>
        <Suspense fallback={<MarketListSkeleton />}>
          <MarketList />
        </Suspense>
      </section>

      {/* Etch-A-Sketch Dials */}
      <Dials />
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    paddingBottom: '120px', // Extra space for fixed dials at bottom
  },
  controlsSection: {
    padding: '24px',
    backgroundColor: 'var(--etcha-red)',
  },
  controlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    gap: '16px',
    flexWrap: 'wrap',
  },
  filterPlaceholder: {
    height: '50px',
    minWidth: '200px',
  },
  marketSection: {
    padding: '24px 0',
  },
};
