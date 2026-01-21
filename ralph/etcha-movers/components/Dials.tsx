'use client';

import React, { useEffect, useState } from 'react';

export default function Dials() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Rotate dials based on scroll position
      // One full rotation (360deg) per 1000px of scroll
      const scrollY = window.scrollY;
      const newRotation = (scrollY / 1000) * 360;
      setRotation(newRotation);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial call to set rotation based on current scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const dialContainerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    left: '24px',
    right: '24px',
    pointerEvents: 'none',
    zIndex: 10,
  };

  const dialStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--etcha-grey)',
    boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: `rotate(${rotation}deg)`,
    transition: 'transform 0.05s ease-out',
  };

  // Left dial rotates clockwise, right dial rotates counter-clockwise
  const leftDialStyle: React.CSSProperties = {
    ...dialStyle,
    transform: `rotate(${rotation}deg)`,
  };

  const rightDialStyle: React.CSSProperties = {
    ...dialStyle,
    transform: `rotate(${-rotation}deg)`,
  };

  // Dial knob indicator styling
  const knobIndicatorStyle: React.CSSProperties = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--etcha-charcoal)',
    position: 'absolute',
    top: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  };

  // Inner ring styling for more Etch-A-Sketch look
  const innerRingStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={dialContainerStyle} aria-hidden="true">
      <div style={leftDialStyle}>
        <div style={innerRingStyle}>
          <div style={knobIndicatorStyle} />
        </div>
      </div>
      <div style={rightDialStyle}>
        <div style={innerRingStyle}>
          <div style={knobIndicatorStyle} />
        </div>
      </div>
    </div>
  );
}
