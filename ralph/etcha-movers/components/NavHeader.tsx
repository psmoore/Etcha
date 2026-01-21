'use client';

import { signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function NavHeader() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo}>Etcha.company</div>

        <div style={styles.userSection} ref={dropdownRef}>
          <button
            style={styles.avatar}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            {userInitial}
          </button>

          {dropdownOpen && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownUserInfo}>
                <span style={styles.dropdownName}>{userName}</span>
                {session?.user?.email && (
                  <span style={styles.dropdownEmail}>{session.user.email}</span>
                )}
              </div>
              <div style={styles.dropdownDivider} />
              <button style={styles.dropdownItem} onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    backgroundColor: 'var(--etcha-red)',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    fontFamily: "'Caveat', cursive",
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--etcha-gold)',
    cursor: 'pointer',
  },
  userSection: {
    position: 'relative' as const,
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'var(--etcha-grey)',
    color: 'var(--etcha-charcoal)',
    border: '2px solid var(--etcha-gold)',
    fontSize: '18px',
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '52px',
    right: 0,
    backgroundColor: 'var(--etcha-grey)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    minWidth: '200px',
    overflow: 'hidden',
    zIndex: 200,
  },
  dropdownUserInfo: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  dropdownName: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--etcha-charcoal)',
  },
  dropdownEmail: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'var(--etcha-charcoal)',
    opacity: 0.7,
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: 'var(--etcha-charcoal)',
    opacity: 0.15,
  },
  dropdownItem: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left' as const,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    color: 'var(--etcha-charcoal)',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};
