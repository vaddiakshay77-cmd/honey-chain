import React, { useState } from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';

export function Navbar() {
  const { activePage, navigateTo, batches } = useHoneyChain();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'register', label: 'Beekeeper Registration' },
    { id: 'batch-entry', label: 'Batch Entry' },
    { id: 'lookup', label: 'Consumer Lookup' },
    { id: 'admin', label: 'Admin Overview' },
  ];

  const handleNav = (pageId) => {
    navigateTo(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => handleNav('landing')}>
          <div className="brand-logo-hex">
            <svg viewBox="0 0 24 24" fill="none" className="hex-icon">
              <path
                d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z"
                stroke="url(#honeyGrad)"
                strokeWidth="2"
                fill="rgba(245, 158, 11, 0.15)"
              />
              <path
                d="M12 6.5L16.8 9.3V14.7L12 17.5L7.2 14.7V9.3L12 6.5Z"
                fill="url(#honeyGrad)"
              />
              <defs>
                <linearGradient id="honeyGrad" x1="3.5" y1="2" x2="20.5" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fbbf24" />
                  <stop offset="1" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
            <div className="glow-ring"></div>
          </div>
          <div className="brand-text">
            <span className="brand-title">
              HONEY<span className="brand-title-accent">CHAIN</span>
            </span>
            <span className="brand-sub">PROVENANCE PROTOCOL</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="navbar-links" aria-label="Main Navigation">
          {navLinks.map(link => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                id={`nav-${link.id}`}
                className={`nav-button ${isActive ? 'nav-button-active' : ''}`}
                onClick={() => handleNav(link.id)}
              >
                {link.label}
                {link.id === 'admin' && (
                  <span className="nav-badge-pill">{batches.length} Blk</span>
                )}
                {isActive && <div className="nav-active-pill-indicator"></div>}
              </button>
            );
          })}
        </nav>

        {/* Session Status & Quick Action */}
        <div className="navbar-actions">
          <div className="session-status" title="Pure in-memory session. No localStorage or backend used.">
            <span className="status-dot-pulse"></span>
            <span className="status-text">Session Memory</span>
          </div>
          <button
            id="nav-quick-verify"
            className="btn-primary-outline btn-compact"
            onClick={() => handleNav('lookup')}
          >
            <span>Scan Jar</span>
          </button>
          
          {/* Mobile hamburger button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className={`burger-bar ${mobileMenuOpen ? 'open-1' : ''}`}></span>
            <span className={`burger-bar ${mobileMenuOpen ? 'open-2' : ''}`}></span>
            <span className={`burger-bar ${mobileMenuOpen ? 'open-3' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu-drawer">
            <div className="mobile-menu-links">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  id={`mobile-nav-${link.id}`}
                  className={`mobile-nav-item ${activePage === link.id ? 'active' : ''}`}
                  onClick={() => handleNav(link.id)}
                >
                  <span className="mobile-nav-label">{link.label}</span>
                  {link.id === 'admin' && <span className="nav-badge-pill">{batches.length} Blocks</span>}
                </button>
              ))}
            </div>
            <div className="mobile-menu-actions">
              <button
                id="mobile-nav-scan-cta"
                className="btn-primary btn-block"
                onClick={() => handleNav('lookup')}
              >
                <span>🔍 Scan & Verify Jar</span>
              </button>
            </div>
            <div className="mobile-menu-footer">
              <span className="status-dot-pulse"></span>
              <span className="status-text">In-Memory Session Mode</span>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
