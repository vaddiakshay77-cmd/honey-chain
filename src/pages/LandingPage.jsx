import React from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';

export function LandingPage() {
  const { navigateTo } = useHoneyChain();

  return (
    <div className="landing-page-root">
      {/* Ambient Decorative Honey Glows */}
      <div className="hero-glow-sphere glow-sphere-1"></div>
      <div className="hero-glow-sphere glow-sphere-2"></div>

      {/* Hero Section */}
      <section className="hero-section landing-hero-compact">
        <div className="hero-badge">
          <span className="badge-pulse"></span>
          <span className="badge-text">Decentralized Honey Provenance Protocol</span>
        </div>

        <h1 className="hero-title">
          Pure Honey Provenance, <br />
          <span className="gradient-honey-text">Backed by Cryptography</span>
        </h1>

        {/* 2-Line Problem Statement */}
        <div className="hero-problem-statement">
          <p className="problem-line-1">
            Over 33% of commercial honey is adulterated with cheap sugar syrups and fraudulent origin labels.
          </p>
          <p className="problem-line-2">
            HoneyChain restores trust from hive to table through immutable cryptographic verification and verified beekeepers.
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="hero-cta-group">
          <button
            id="hero-primary-cta"
            className="btn-primary btn-lg"
            onClick={() => navigateTo('lookup')}
          >
            <span>🔍 Verify Honey Batch</span>
          </button>
          <button
            id="hero-secondary-cta"
            className="btn-secondary btn-lg"
            onClick={() => navigateTo('register')}
          >
            <span>🐝 Register as Beekeeper</span>
          </button>
        </div>
      </section>
    </div>
  );
}
