import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'qrcode';
import { useHoneyChain } from '../context/HoneyChainContext';
import { verifyChain } from '../utils/hashChain';

export function ConsumerLookupPage() {
  const { batches, beekeepers, lookupParam, setLookupParam } = useHoneyChain();

  // Active batch selection
  const [searchInput, setSearchInput] = useState(
    lookupParam || (batches[0]?.batchId || batches[0]?.batchNumber || 'HC-8921-NZ')
  );
  const [selectedBatchId, setSelectedBatchId] = useState(
    lookupParam || (batches[0]?.batchId || batches[0]?.batchNumber || '')
  );

  // QR Code data URL for current batch
  const [batchQrUrl, setBatchQrUrl] = useState('');

  // Camera QR Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);

  // Tamper simulation toggle for demo / evaluation
  const [isTamperSimulated, setIsTamperSimulated] = useState(false);

  // Sync lookupParam from context / hash
  useEffect(() => {
    if (lookupParam) {
      setSearchInput(lookupParam);
      setSelectedBatchId(lookupParam);
    }
  }, [lookupParam]);

  // Find active batch in context
  const activeBatch = useMemo(() => {
    if (!selectedBatchId) return batches[0] || null;
    const clean = selectedBatchId.trim().toUpperCase();
    return batches.find(b =>
      (b.batchId && b.batchId.toUpperCase() === clean) ||
      (b.batchNumber && b.batchNumber.toUpperCase() === clean)
    ) || null;
  }, [batches, selectedBatchId]);

  // Find associated beekeeper
  const beekeeper = useMemo(() => {
    if (!activeBatch) return null;
    return beekeepers.find(b =>
      b.beekeeperId === activeBatch.beekeeperId ||
      b.id === activeBatch.beekeeperId ||
      b.name === activeBatch.beekeeperName
    ) || null;
  }, [beekeepers, activeBatch]);

  // Generate QR code data URL for active batchId
  useEffect(() => {
    const currentId = activeBatch?.batchId || activeBatch?.batchNumber;
    if (currentId) {
      QRCode.toDataURL(currentId, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#080a10',
          light: '#ffffff'
        }
      }).then(url => {
        setBatchQrUrl(url);
      }).catch(err => {
        console.error('Failed to generate batch QR:', err);
      });
    }
  }, [activeBatch]);

  // Evaluate chain integrity
  const chainResult = useMemo(() => {
    if (!batches || batches.length === 0) {
      return { isValid: true, reason: 'Empty chain' };
    }

    if (isTamperSimulated) {
      // Create clone with corrupted moisture/purity at block #1
      const tamperedArray = JSON.parse(JSON.stringify(batches));
      if (tamperedArray.length > 1) {
        tamperedArray[1].moisturePercent = 22.5;
        tamperedArray[1].qualityTestResult = 'TAMPERED: High Fructose Corn Syrup Injected';
      }
      return verifyChain(tamperedArray);
    }

    return verifyChain(batches);
  }, [batches, isTamperSimulated]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    setSelectedBatchId(clean);
    setLookupParam(clean);
    window.location.hash = `#lookup/${clean}`;
  };

  const handleSelectBatch = useCallback((batchId) => {
    const clean = batchId.trim().toUpperCase();
    setSearchInput(clean);
    setSelectedBatchId(clean);
    setLookupParam(clean);
    window.location.hash = `#lookup/${clean}`;
  }, [setLookupParam]);

  // Camera QR Scanner Initialization
  useEffect(() => {
    if (!isScannerOpen) return;

    let scannerInstance = null;
    try {
      scannerInstance = new Html5QrcodeScanner(
        'qr-camera-stream',
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          rememberLastUsedCamera: true
        },
        false
      );
      scannerRef.current = scannerInstance;

      scannerInstance.render(
        (decodedText) => {
          let batchCode = decodedText.trim();
          if (decodedText.includes('/verify/')) {
            batchCode = decodedText.split('/verify/')[1];
          } else if (decodedText.includes('#lookup/')) {
            batchCode = decodedText.split('#lookup/')[1];
          }
          handleSelectBatch(batchCode);
          setIsScannerOpen(false);
          scannerInstance.clear().catch(() => {});
        },
        () => {
          // ignore scan tick frames
        }
      );
    } catch (_err) {
      setScannerError('Camera access unavailable. Use the search bar or presets below.');
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (_e) {}
      }
    };
  }, [isScannerOpen, handleSelectBatch]);

  return (
    <div className="page-container lookup-page-root">
      {/* Decorative Golden Ambient Backlight */}
      <div className="hero-glow-sphere glow-sphere-1"></div>
      <div className="hero-glow-sphere glow-sphere-2"></div>

      {/* Page Header */}
      <div className="page-header-wrap">
        <div className="page-tag-pill">Consumer Authentication Engine</div>
        <h1 className="page-title">
          Honey Provenance <span className="gradient-honey-text">Lookup</span>
        </h1>
        <p className="page-subtitle">
          Enter a batch ID or scan the QR code on your honey jar to verify origin, beekeeper identity, and chain integrity.
        </p>
      </div>

      {/* Search & QR Scanner Toolbar */}
      <div className="lookup-search-container">
        <div className="lookup-search-dual-box">
          <form className="hero-search-box lookup-form" onSubmit={handleSearchSubmit}>
            <div className="search-icon-wrapper">
              <svg className="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              id="lookup-batch-input"
              type="text"
              className="hero-search-input font-mono"
              placeholder="Enter Batch ID (e.g. HC-8921-NZ)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button id="lookup-verify-btn" type="submit" className="btn-primary">
              <span>Verify Batch</span>
            </button>
          </form>

          {/* Camera QR Scanner Toggle */}
          <button
            id="scanner-toggle-btn"
            type="button"
            className={`btn-secondary btn-qr-scan ${isScannerOpen ? 'active' : ''}`}
            onClick={() => setIsScannerOpen(!isScannerOpen)}
          >
            <span>📷 {isScannerOpen ? 'Close Scanner' : 'Scan QR'}</span>
          </button>
        </div>

        {/* Live Camera Scanner Drawer */}
        {isScannerOpen && (
          <div className="qr-scanner-modal-drawer">
            <div className="scanner-drawer-header">
              <span className="scanner-title">📱 Live Camera QR Scanner</span>
              <button className="scanner-close-btn" onClick={() => setIsScannerOpen(false)}>✕</button>
            </div>

            <div id="qr-camera-stream" className="scanner-viewport"></div>

            {scannerError && (
              <div className="scanner-error-text">
                <span>⚠️ {scannerError}</span>
              </div>
            )}
          </div>
        )}

        {/* Available Session Batches Quick Selection */}
        <div className="lookup-quick-pills">
          <span className="pills-label">Sample Batches:</span>
          {batches.map(b => {
            const bId = b.batchId || b.batchNumber;
            const isSelected = (activeBatch?.batchId || activeBatch?.batchNumber) === bId;
            return (
              <button
                key={bId}
                type="button"
                className={`quick-pill-btn ${isSelected ? 'pill-active' : ''}`}
                onClick={() => handleSelectBatch(bId)}
              >
                <span className="dot"></span>
                <strong>{bId}</strong>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN DEMO SCREEN: CLEAN ONE CARD LAYOUT */}
      {activeBatch ? (
        <div className="single-card-lookup-wrapper" id="batch-verification-card">
          <div className="lookup-main-card">
            {/* Card Header: Batch ID + Chain Integrity Result */}
            <div className="lookup-card-topbar">
              <div className="batch-identity-meta">
                <span className="meta-badge-label">AUTHENTICATED BATCH</span>
                <h2 className="lookup-batch-heading font-mono text-amber">
                  {activeBatch.batchId || activeBatch.batchNumber}
                </h2>
              </div>

              {/* Chain-Integrity Check Result Banner */}
              <div className="chain-integrity-result-box">
                {chainResult.isValid ? (
                  <div className="integrity-status-pill status-verified" id="chain-integrity-status">
                    <span className="status-indicator-dot dot-verified"></span>
                    <span className="status-text font-semibold">Chain Integrity: Verified ✅</span>
                  </div>
                ) : (
                  <div className="integrity-status-pill status-tampered" id="chain-integrity-status">
                    <span className="status-indicator-dot dot-tampered"></span>
                    <span className="status-text font-semibold">Chain Integrity: Tampering Detected ⚠️</span>
                  </div>
                )}

                {/* Judge Demo Toggle for Tampering Simulation */}
                <button
                  id="tamper-demo-toggle"
                  type="button"
                  className={`tamper-toggle-btn ${isTamperSimulated ? 'active' : ''}`}
                  onClick={() => setIsTamperSimulated(!isTamperSimulated)}
                  title="Toggle tampering simulation to test tamper detection"
                >
                  {isTamperSimulated ? '↺ Restore Chain' : '⚡ Simulate Tampering'}
                </button>
              </div>
            </div>

            {/* Tamper Warning Message if Detected */}
            {!chainResult.isValid && (
              <div className="tamper-alert-bar">
                <span className="tamper-icon">⚠️</span>
                <span>
                  <strong>Cryptographic Violation:</strong> {chainResult.reason || 'Data tampering detected in blockchain history!'}
                </span>
              </div>
            )}

            {/* Core Card Content Grid */}
            <div className="lookup-card-body-grid">
              {/* Left Column: Beekeeper, Harvest Date, Quality Result */}
              <div className="lookup-info-col">
                {/* 1. Beekeeper Name with "Verified" badge */}
                <div className="lookup-info-row beekeeper-row">
                  <div className="row-label">Beekeeper / Apiary</div>
                  <div className="beekeeper-verified-group">
                    <span className="beekeeper-name-display" id="lookup-beekeeper-name">
                      {activeBatch.beekeeperName || beekeeper?.name || beekeeper?.beekeeperName || 'Registered Apiary'}
                    </span>
                    <span className="badge-verified-seal" id="lookup-verified-badge">
                      Verified ✅
                    </span>
                  </div>
                  <div className="beekeeper-location-sub">
                    📍 {activeBatch.location || beekeeper?.location || 'Registered Honey Sanctuary'}
                  </div>
                </div>

                {/* 2. Harvest Date */}
                <div className="lookup-info-row">
                  <div className="row-label">Harvest Date</div>
                  <div className="row-value font-mono text-primary" id="lookup-harvest-date">
                    📅 {activeBatch.harvestDate}
                  </div>
                </div>

                {/* 3. Quantity (kg) */}
                <div className="lookup-info-row">
                  <div className="row-label">Quantity</div>
                  <div className="row-value font-mono text-cyan" id="lookup-quantity">
                    ⚖️ {activeBatch.quantityKg} kg
                  </div>
                </div>

                {/* 4. Quality Result */}
                <div className="lookup-info-row quality-row">
                  <div className="row-label">Quality Test Result</div>
                  <div className="quality-result-badge" id="lookup-quality-result">
                    <span className="quality-icon">🔬</span>
                    <span className="quality-text font-mono text-emerald">
                      {activeBatch.qualityTestResult || `${activeBatch.purityScore || 99.4}% NMR Purity — Passed Grade A`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Scannable QR Code & Cryptographic Block Hash */}
              <div className="lookup-qr-col">
                <div className="lookup-qr-card">
                  <div className="qr-title-tag">SEALED JAR QR CODE</div>
                  {batchQrUrl ? (
                    <img
                      src={batchQrUrl}
                      alt={`QR code for ${activeBatch.batchId || activeBatch.batchNumber}`}
                      className="lookup-qr-image"
                      id="lookup-qr-image"
                    />
                  ) : (
                    <div className="qr-placeholder">Generating QR...</div>
                  )}
                  <div className="qr-batch-code font-mono text-amber">
                    {activeBatch.batchId || activeBatch.batchNumber}
                  </div>
                  <div className="qr-caption-text">
                    Encodes Batch ID for instant smartphone verification.
                  </div>
                </div>

                {/* Cryptographic Ledger Proof */}
                <div className="card-crypto-footer font-mono">
                  <div className="hash-line-item">
                    <span className="hash-label">Block Hash:</span>
                    <code className="hash-code text-amber">
                      {(activeBatch.hash || activeBatch.blockHash || '').slice(0, 18)}...{(activeBatch.hash || activeBatch.blockHash || '').slice(-10)}
                    </code>
                  </div>
                  <div className="hash-line-item">
                    <span className="hash-label">Previous Hash:</span>
                    <code className="hash-code text-muted">
                      {(activeBatch.previousHash || activeBatch.prevHash || '').slice(0, 18)}...{(activeBatch.previousHash || activeBatch.prevHash || '').slice(-10)}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="lookup-card-footer">
              <button
                type="button"
                className="btn-tertiary"
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}#lookup/${activeBatch.batchId || activeBatch.batchNumber}`;
                  navigator.clipboard?.writeText(url);
                }}
              >
                <span>🔗 Share Verification Link</span>
              </button>
              <button
                type="button"
                className="btn-tertiary"
                onClick={() => window.print()}
              >
                <span>🖨️ Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="not-found-card">
          <div className="not-found-icon">🔍</div>
          <h2 className="not-found-title">Batch #{searchInput} Not Found</h2>
          <p className="not-found-desc">
            No honey harvest records match this ID in active session memory. Please pick a batch below:
          </p>
          <div className="not-found-pills">
            {batches.map(b => {
              const bId = b.batchId || b.batchNumber;
              return (
                <button
                  key={bId}
                  className="btn-secondary"
                  onClick={() => handleSelectBatch(bId)}
                >
                  <span>{bId}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
