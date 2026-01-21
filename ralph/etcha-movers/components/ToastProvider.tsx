'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '8px',
          padding: '12px 20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
        // Success toast styling
        success: {
          style: {
            background: '#22C55E',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#22C55E',
          },
        },
        // Error toast styling
        error: {
          style: {
            background: '#EF4444',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#EF4444',
          },
        },
      }}
      containerStyle={{
        top: 80, // Below the sticky header
      }}
    />
  );
}
