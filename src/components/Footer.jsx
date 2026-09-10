import React from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';

export function Footer() {
  const { navigateTo, batches, beekeepers, resetToSeedData } = useHoneyChain();

  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <span className="brand-title">
                HONEY<span className="brand-title-accent">CHAIN</span>
              </span>
            </div>
            <p className="footer-desc">
              A cryptographic honey authenticity & supply chain verification protocol.
              Eliminating syrup dilution and origin adulteration by anchoring harvest batches,
              floral DNA ratios, and NMR test results in an immutable simulated ledger.
            </p>
            <div className="footer-tags">
              <span className="footer-tag">🔒 Zero Backend</span>
              <span className="footer-tag">⚡ In-Memory State</span>
              <span className="footer-tag">🚫 No LocalStorage</span>
              <span className="footer-tag">🛡️ Vanilla CSS</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links">
              <li><button onClick={() => navigateTo('landing')}>Protocol Home</button></li>
              <li><button onClick={() => navigateTo('register')}>Register Apiary Node</button></li>
              <li><button onClick={() => navigateTo('batch-entry')}>Mint Batch Block</button></li>
              <li><button onClick={() => navigateTo('lookup')}>Consumer Verification</button></li>
              <li><button onClick={() => navigateTo('admin')}>Blockchain Explorer</button></li>
            </ul>
          </div>

          {/* Live Network State */}
          <div className="footer-col">
            <h4 className="footer-col-title">Ledger Telemetry</h4>
            <div className="footer-telemetry-box">
              <div className="telemetry-row">
                <span className="telemetry-label">Active Apiaries:</span>
                <span className="telemetry-val">{beekeepers.length} Nodes</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Blocks Minted:</span>
                <span className="telemetry-val">{batches.length} Blocks</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Consensus State:</span>
                <span className="telemetry-val text-emerald">Synchronized</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Storage Mode:</span>
                <span className="telemetry-val text-amber">Session Context</span>
              </div>
              <button
                className="btn-reset-seed"
                onClick={resetToSeedData}
                title="Reset ledger to initial verified seed blocks"
              >
                ↻ Reset Demo Ledger
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} HoneyChain Protocol. Built with React Context API & Plain CSS.</p>
          <div className="footer-bottom-links">
            <span>Non-Adulteration Standard ISO 19657</span>
            <span>•</span>
            <span>Nuclear Magnetic Resonance (NMR) Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
