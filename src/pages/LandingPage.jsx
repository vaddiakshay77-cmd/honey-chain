import React, { useState } from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';

export function LandingPage() {
  const { batches, beekeepers, navigateTo } = useHoneyChain();
  const [searchInput, setSearchInput] = useState('');

  const totalKg = batches.reduce((acc, b) => acc + (b.quantityKg || 0), 0);
  const avgPurity = (
    batches.reduce((acc, b) => acc + (b.purityScore || 0), 0) / (batches.length || 1)
  ).toFixed(1);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigateTo('lookup', searchInput.trim().toUpperCase());
    }
  };

  const handleSampleClick = (batchId) => {
    navigateTo('lookup', batchId);
  };

  return (
    <div className="landing-page-root">
      {/* Background Decorative Ambient Honey Glows */}
      <div className="hero-glow-sphere glow-sphere-1"></div>
      <div className="hero-glow-sphere glow-sphere-2"></div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-pulse"></span>
          <span className="badge-text">Decentralized Honey Provenance Protocol</span>
        </div>

        <h1 className="hero-title">
          Pure Honey Provenance, <br />
          <span className="gradient-honey-text">Backed by Cryptography</span>
        </h1>

        <p className="hero-subtitle">
          Over 33% of commercial honey is cut with sugar syrups or falsely labeled.
          HoneyChain connects honest beekeepers directly to consumers through immutable
          cryptographic hash chaining, Aadhaar identity verification, and laboratory NMR purity testing.
        </p>

        {/* Primary CTA Buttons */}
        <div className="hero-cta-group">
          <button
            id="hero-primary-lookup-cta"
            className="btn-primary btn-lg"
            onClick={() => navigateTo('lookup')}
          >
            <span>🔍 Verify a Honey Batch</span>
          </button>
          <button
            id="hero-secondary-register-cta"
            className="btn-secondary btn-lg"
            onClick={() => navigateTo('register')}
          >
            <span>🐝 Register as Beekeeper</span>
          </button>
        </div>

        {/* Quick Batch Lookup Bar */}
        <div className="hero-search-wrapper">
          <form className="hero-search-box" onSubmit={handleSearch}>
            <div className="search-icon-wrapper">
              <svg className="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              id="hero-batch-search-input"
              type="text"
              className="hero-search-input font-mono"
              placeholder="Enter Batch ID (e.g. HC-8921-NZ or HC-IN-7429)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              id="hero-batch-search-submit"
              type="submit"
              className="btn-primary"
            >
              <span>Verify</span>
            </button>
          </form>

          {/* Quick Sample Pills */}
          <div className="hero-sample-pills">
            <span className="sample-pill-label">Try Sample Batches:</span>
            {batches.slice(0, 4).map((b) => {
              const bId = b.batchId || b.batchNumber;
              return (
                <button
                  key={bId}
                  className="sample-pill-btn"
                  onClick={() => handleSampleClick(bId)}
                >
                  <span className="pill-dot"></span>
                  <strong>{bId}</strong>
                  <span className="pill-flora">({b.floralType?.split(' ')[0] || 'Honey'})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-STEP "HOW HONEYCHAIN WORKS" EXPLAINER */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-title-wrap">
          <div className="page-tag-pill">Step-by-Step Architecture</div>
          <h2 className="section-title">How HoneyChain Works</h2>
          <p className="section-sub">
            A transparent 3-step custody protocol ensuring every jar is authentic, lab-tested, and untampered.
          </p>
        </div>

        <div className="workflow-steps-3">
          {/* Step 1 */}
          <div className="step-card">
            <div className="step-top-row">
              <span className="step-badge">STEP 01</span>
              <span className="step-icon">🛡️</span>
            </div>
            <h3 className="step-card-title">Beekeeper Onboarding & e-KYC</h3>
            <p className="step-card-desc">
              Master beekeepers register their apiary locations, managed hives, and verify their identity
              via simulated Aadhaar e-KYC to establish an authenticated producer node ID.
            </p>
            <div className="step-card-footer">
              <button
                className="step-action-link"
                onClick={() => navigateTo('register')}
              >
                Register Apiary →
              </button>
            </div>
          </div>

          <div className="step-connector-arrow">➔</div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-top-row">
              <span className="step-badge">STEP 02</span>
              <span className="step-icon">⛓️</span>
            </div>
            <h3 className="step-card-title">Harvest Minting & Hash Chaining</h3>
            <p className="step-card-desc">
              Harvest metrics—harvest date, moisture content (&le;18.6%), and laboratory NMR purity scores—are sealed
              into an immutable block chained to the preceding batch hash using SHA-256.
            </p>
            <div className="step-card-footer">
              <button
                className="step-action-link"
                onClick={() => navigateTo('batch-entry')}
              >
                Mint Batch Block →
              </button>
            </div>
          </div>

          <div className="step-connector-arrow">➔</div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-top-row">
              <span className="step-badge">STEP 03</span>
              <span className="step-icon">📱</span>
            </div>
            <h3 className="step-card-title">QR Jar Seal & Consumer Verification</h3>
            <p className="step-card-desc">
              Every jar is sealed with a unique QR code. Consumers scan the lid with their smartphone to view
              the unbroken custody timeline, lab purity certificates, and instant tamper detection.
            </p>
            <div className="step-card-footer">
              <button
                className="step-action-link"
                onClick={() => navigateTo('lookup')}
              >
                Verify Honey Jar →
              </button>
            </div>
          </div>
        </div>

        {/* Section CTA Button */}
        <div className="how-it-works-cta">
          <button
            id="how-it-works-cta-btn"
            className="btn-primary btn-lg"
            onClick={() => navigateTo('lookup', batches[0]?.batchId || batches[0]?.batchNumber)}
          >
            <span>🔍 Inspect Live Verified Certificate</span>
          </button>
        </div>
      </section>

      {/* Realtime Stats Bar */}
      <section className="stats-strip">
        <div className="stat-card">
          <div className="stat-val gradient-honey-text">{beekeepers.length}</div>
          <div className="stat-name">Registered Apiaries</div>
          <div className="stat-detail">Aadhaar verified producers</div>
        </div>
        <div className="stat-card">
          <div className="stat-val gradient-honey-text">{batches.length}</div>
          <div className="stat-name">Blocks Chained</div>
          <div className="stat-detail">Sequential SHA-256 hashes</div>
        </div>
        <div className="stat-card">
          <div className="stat-val gradient-honey-text">{totalKg.toLocaleString()} kg</div>
          <div className="stat-name">Raw Honey Tracked</div>
          <div className="stat-detail">Zero sugar syrup dilution</div>
        </div>
        <div className="stat-card">
          <div className="stat-val text-emerald">{avgPurity}%</div>
          <div className="stat-name">Mean Purity Index</div>
          <div className="stat-detail">NMR & pollen DNA validated</div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bottom-cta-banner">
        <div className="banner-content">
          <h2 className="banner-title">Protecting Honey Purity from Hive to Table</h2>
          <p className="banner-desc">
            Experience the HoneyChain protocol right now. All cryptographic hash calculations,
            chain verification, and batch lookups run live in your browser.
          </p>
          <div className="banner-buttons">
            <button
              id="bottom-verify-cta"
              className="btn-primary btn-lg"
              onClick={() => navigateTo('lookup')}
            >
              <span>Scan or Enter Batch Code</span>
            </button>
            <button
              id="bottom-admin-cta"
              className="btn-secondary btn-lg"
              onClick={() => navigateTo('admin')}
            >
              <span>Explore Blockchain Ledger</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
