'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.screen}>
        <h1 style={styles.headline}>Etcha Movers</h1>
        <p style={styles.description}>
          Track the top prediction market movers with AI-generated explanations
        </p>
        <button style={styles.button} onClick={handleSignIn}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#CC0000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  screen: {
    backgroundColor: '#E8E4E0',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  headline: {
    fontFamily: "'Caveat', cursive",
    fontSize: '48px',
    color: '#2A2A2A',
    margin: '0 0 16px 0',
    fontWeight: 700,
  },
  description: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    color: '#2A2A2A',
    margin: '0 0 32px 0',
    lineHeight: 1.6,
  },
  button: {
    backgroundColor: '#C5A356',
    color: '#2A2A2A',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 28px',
    fontSize: '16px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};
