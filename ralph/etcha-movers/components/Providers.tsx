'use client';

import { SessionProvider } from 'next-auth/react';
import ToastProvider from './ToastProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <ToastProvider />
    </SessionProvider>
  );
}
