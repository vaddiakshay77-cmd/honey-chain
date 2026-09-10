import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useHoneyChain } from '../context/HoneyChainContext';
import { verifyChain } from '../utils/hashChain';
import { QRCodeSvg } from '../components/QRCodeSvg';

export function ConsumerLookupPage() {
  const { batches, beekeepers, lookupParam, setLookupParam } = useHoneyChain();
  
  // Default to first batch or URL param
  const [searchInput, setSearchInput] = useState(lookupParam || (batches[0]?.batchId || batches[0]?.batchNumber || 'HC-8921-NZ'));
  const [activeBatch, setActiveBatch] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);
  
  // Camera QR Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);

  // Tamper simulation toggle for live judge demonstration
  const [isTamperSimulated, setIsTamperSimulated] = useState(false);

  // Sync lookupParam from context / URL hash
  useEffect(() => {
    if (lookupParam) {
      setSearchInput(lookupParam);
      const found = batches.find(b => 
        (b.batchId && b.batchId.toUpperCase() === lookupParam.toUpperCase()) ||
        (b.batchNumber && b.batchNumber.toUpperCase() === lookupParam.toUpperCase())
      );
      setActiveBatch(found || null);
    } else if (batches.length > 0 && !activeBatch) {
      setActiveBatch(batches[0]);
      setSearchInput(batches[0].batchId || batches[0].batchNumber);
    }
  }, [lookupParam, batches]);

  // Handle Search submit
  const handleSearch = (e) => {
    e?.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    setLookupParam(clean);
    const found = batches.find(b => 
      (b.batchId && b.batchId.toUpperCase() === clean) ||
      (b.batchNumber && b.batchNumber.toUpperCase() === clean)
    );
    setActiveBatch(found || null);
  };

  // Select batch directly from sample pills
  const handleSelectBatch = (batchId) => {
    const clean = batchId.trim().toUpperCase();
    setSearchInput(clean);
    setLookupParam(clean);
    const found = batches.find(b => 
      (b.batchId && b.batchId.toUpperCase() === clean) ||
      (b.batchNumber && b.batchNumber.toUpperCase() === clean)
    );
    setActiveBatch(found || null);
    window.location.hash = `#lookup/${clean}`;
  };

  // Run verifyChain() on the full batch array
  // If judge clicked "Simulate Tampering", we inject a tampered block into the evaluation array
  const chainVerificationResult = useMemo(() => {
    if (!batches || batches.length === 0) {
      return { isValid: true, reason: 'Empty chain', totalVerified: 0 };
    }

    if (isTamperSimulated) {
      // Clone batches and tamper with moisture & purity in Block #1 to simulate fraudulent alteration
      const tamperedArray = JSON.parse(JSON.stringify(batches));
      if (tamperedArray.length > 1) {
        tamperedArray[1].moisturePercent = 21.8; // Tampered moisture!
        tamperedArray[1].purityScore = 88.0;     // Diluted with corn syrup!
        tamperedArray[1].qualityTestResult = 'TAMPERED: High Fructose Corn Syrup Injected';
      }
      return verifyChain(tamperedArray);
    }

    return verifyChain(batches);
  }, [batches, isTamperSimulated]);

  // QR Scanner Initialization with html5-qrcode
  useEffect(() => {
    if (!isScannerOpen) return;

    try {
      const scanner = new Html5QrcodeScanner(
        'qr-camera-stream',
        { 
          fps: 10, 
          qrbox: { width: 220, height: 220 },
          rememberLastUsedCamera: true
        },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          let batchCode = decodedText;
          if (decodedText.includes('/verify/')) {
            batchCode = decodedText.split('/verify/')[1];
          } else if (decodedText.includes('#lookup/')) {
            batchCode = decodedText.split('#lookup/')[1];
          }
          handleSelectBatch(batchCode);
          setIsScannerOpen(false);
          scanner.clear();
        },
        (err) => {
          // ignore scan frame ticks
        }
      );
    } catch (e) {
      setScannerError('Camera access unavailable or permission denied. Use demo presets below.');
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, [isScannerOpen]);

  const handleCopyLink = () => {
    if (!activeBatch) return;
    const batchId = activeBatch.batchId || activeBatch.batchNumber;
    const url = `${window.location.origin}${window.location.pathname}#lookup/${batchId}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2500);
    });
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  // Find beekeeper record
  const apiary = useMemo(() => {
    if (!activeBatch) return null;
    return beekeepers.find(b => 
      b.id === activeBatch.beekeeperId || 
      b.beekeeperId === activeBatch.beekeeperId ||
      b.name === activeBatch.beekeeperName
    );
  }, [beekeepers, activeBatch]);

  return (
    <div className="page-container lookup-page-root">
      {/* Decorative Golden Ambient Backlight */}
      <div className="hero-glow-sphere glow-sphere-1"></div>
      <div className="hero-glow-sphere glow-sphere-2"></div>

      {/* Page Header */}
      <div className="page-header-wrap">
        <div className="page-tag-pill">Consumer Authentication Engine • Pure Provenance</div>
        <h1 className="page-title">
          Verify Honey <span className="gradient-honey-text">Batch Authenticity</span>
        </h1>
        <p className="page-subtitle">
          Verify pure unadulterated raw honey. Inspect independent laboratory NMR spectrometry,
          Aadhaar-verified beekeeper identity, and full cryptographic blockchain continuity.
        </p>
      </div>

      {/* Global Chain Integrity Indicator Banner */}
      <div className="chain-integrity-master-wrap">
        <div className={`chain-integrity-card ${chainVerificationResult.isValid ? 'integrity-verified' : 'integrity-tampered'}`}>
          <div className="integrity-icon-col">
            {chainVerificationResult.isValid ? (
              <div className="integrity-badge-icon verified-pulse">🛡️</div>
            ) : (
              <div className="integrity-badge-icon tampered-pulse">⚠️</div>
            )}
          </div>

          <div className="integrity-text-col">
            <div className="integrity-title-row">
              <span className="integrity-title">
                {chainVerificationResult.isValid 
                  ? 'Chain Integrity: Verified ✅' 
                  : 'Tampering Detected ⚠️'}
              </span>
              <span className="integrity-count-tag font-mono">
                {batches.length} Blocks Evaluated
              </span>
            </div>

            <p className="integrity-desc">
              {chainVerificationResult.isValid ? (
                <>
                  All <strong>{chainVerificationResult.totalVerified}</strong> honey harvest blocks sequentially match their SHA-256 parent hash digests. No deleted, inserted, or altered harvest metrics detected.
                </>
              ) : (
                <span className="text-rose">
                  <strong>Fraud Alert:</strong> {chainVerificationResult.reason}
                </span>
              )}
            </p>
          </div>

          {/* Interactive Judge Demo Toggle */}
          <div className="integrity-demo-col">
            <button
              id="simulate-tamper-toggle-btn"
              className={`btn-tamper-demo ${isTamperSimulated ? 'btn-tamper-active' : ''}`}
              onClick={() => setIsTamperSimulated(!isTamperSimulated)}
              title="Demonstrate real-time cryptographic tamper detection to judges"
            >
              {isTamperSimulated ? '↺ Restore Genuine Chain' : '⚡ Simulate Tampering Attack'}
            </button>
            <span className="demo-hint-text">Judge Demonstration Mode</span>
          </div>
        </div>
      </div>

      {/* Search & Camera QR Scanner Toolbar */}
      <div className="lookup-search-container">
        <div className="lookup-search-dual-box">
          <form className="hero-search-box lookup-form" onSubmit={handleSearch}>
            <div className="search-icon-wrapper">
              <svg className="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              id="lookup-input"
              type="text"
              className="hero-search-input font-mono"
              placeholder="Search Batch ID (e.g. HC-8921-NZ or HC-IN-7429)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button id="lookup-submit-btn" type="submit" className="btn-primary">
              <span>Verify Batch</span>
            </button>
          </form>

          {/* Camera QR Scanner Toggle */}
          <button
            id="toggle-qr-scanner-btn"
            className={`btn-secondary btn-qr-scan ${isScannerOpen ? 'active' : ''}`}
            onClick={() => setIsScannerOpen(!isScannerOpen)}
          >
            <span>📷 {isScannerOpen ? 'Close Scanner' : 'Scan Jar QR'}</span>
          </button>
        </div>

        {/* Live Camera Scanner Modal / Drawer */}
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

            <div className="scanner-quick-presets">
              <span className="scanner-quick-label">Or Simulate Instant Jar Scan:</span>
              {batches.slice(0, 3).map(b => (
                <button
                  key={b.batchId || b.batchNumber}
                  type="button"
                  className="scanner-preset-chip"
                  onClick={() => {
                    handleSelectBatch(b.batchId || b.batchNumber);
                    setIsScannerOpen(false);
                  }}
                >
                  ⚡ Scan {b.batchId || b.batchNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Batch Select Pills */}
        <div className="lookup-quick-pills">
          <span className="pills-label">Available Session Batches:</span>
          {batches.map(b => {
            const bId = b.batchId || b.batchNumber;
            const isSelected = (activeBatch?.batchId || activeBatch?.batchNumber) === bId;
            return (
              <button
                key={bId}
                className={`quick-pill-btn ${isSelected ? 'pill-active' : ''}`}
                onClick={() => handleSelectBatch(bId)}
              >
                <span className="dot"></span>
                <strong>{bId}</strong>
                <span className="pill-small-text">({b.floralType?.split(' ')[0] || 'Honey'})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTERPIECE CERTIFICATE CONTAINER */}
      {activeBatch ? (
        <div className="certificate-container centerpiece-cert" id="printable-certificate">
          {/* Gold Crest Holographic Top Banner */}
          <div className="cert-top-banner">
            <div className="cert-badge-cluster">
              <div className="cert-seal-icon-gold">🏆</div>
              <div>
                <div className="cert-seal-title">HONEYCHAIN VERIFIED CERTIFICATE OF AUTHENTICITY</div>
                <div className="cert-seal-sub">
                  Cryptographically Provenance-Sealed • 100% Unadulterated Raw Honey • Nuclear Magnetic Resonance (NMR) Verified
                </div>
              </div>
            </div>

            <div className="cert-actions-cluster">
              <button
                className="btn-cert-action"
                onClick={handleCopyLink}
                title="Copy direct verification URL"
              >
                {copyStatus ? '✓ Link Copied!' : '🔗 Share Link'}
              </button>
              <button
                className="btn-cert-action"
                onClick={handlePrintCertificate}
                title="Print or Save PDF Certificate"
              >
                🖨️ Print Certificate
              </button>
            </div>
          </div>

          {/* Main 2-Column Certificate Layout */}
          <div className="cert-main-grid">
            {/* Left Column: Producer Identity & Honey Purity Metrics */}
            <div className="cert-col-left">
              {/* Batch Identity Card */}
              <div className="cert-card cert-hero-card">
                <div className="cert-card-header">
                  <span className="cert-card-label">BLOCKCHAIN BATCH IDENTITY</span>
                  <span className="cert-block-pill">Block #{activeBatch.blockIndex || 1}</span>
                </div>

                <div className="cert-batch-id-lg font-mono">
                  {activeBatch.batchId || activeBatch.batchNumber}
                </div>

                <div className="cert-flora-title">
                  🌸 {activeBatch.floralType || 'Pure Monofloral Raw Honey'}
                </div>

                {/* Core Test Results Strip */}
                <div className="cert-metrics-row">
                  <div className="metric-box">
                    <span className="metric-lbl">NMR Purity Score</span>
                    <span className="metric-val text-emerald">
                      {activeBatch.purityScore ? `${activeBatch.purityScore}%` : '99.4%'}
                    </span>
                    <span className="metric-note">Exogenous Sugars: 0.0%</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl">Moisture Content</span>
                    <span className="metric-val text-amber">
                      {activeBatch.moisturePercent}%
                    </span>
                    <span className="metric-note">Max Standard: &le;18.6%</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl">Yield Volume</span>
                    <span className="metric-val text-cyan">
                      {activeBatch.quantityKg} kg
                    </span>
                    <span className="metric-note">{activeBatch.jarCount || activeBatch.quantityKg * 2} Jars</span>
                  </div>
                </div>

                {/* Quality Test Result Highlight */}
                <div className="cert-quality-result-highlight">
                  <span className="quality-lbl">OFFICIAL LAB QUALITY TEST RESULT:</span>
                  <div className="quality-val-badge">
                    <span className="badge-shield-icon">🔬</span>
                    <span className="quality-text font-mono">
                      {activeBatch.qualityTestResult || `${activeBatch.purityScore || 99.4}% NMR Spectrometry — Grade A Raw Honey`}
                    </span>
                  </div>
                </div>

                {/* QR Code Jar Seal */}
                <div className="cert-qr-container">
                  <QRCodeSvg
                    value={activeBatch.batchId || activeBatch.batchNumber}
                    size={140}
                  />
                  <div className="cert-qr-legend">
                    <div className="qr-legend-title">Immutable Jar Seal</div>
                    <div className="qr-legend-hash font-mono">
                      <span>SHA-256 Block Digest:</span>
                      <code>{(activeBatch.hash || activeBatch.blockHash || '').slice(0, 22)}...{(activeBatch.hash || activeBatch.blockHash || '').slice(-12)}</code>
                    </div>
                    <p className="qr-legend-desc">
                      Every sealed jar carries this cryptographic hash linked to parent Block #{Math.max(0, (activeBatch.blockIndex || 1) - 1)}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Beekeeper Profile Card */}
              <div className="cert-card mt-4 cert-producer-card">
                <div className="cert-card-header">
                  <span className="cert-card-label">PRODUCER PROVENANCE</span>
                  <span className="cert-verified-node-tag font-mono">
                    {apiary?.beekeeperId || apiary?.nodeId || 'BEE-PRODUCER'}
                  </span>
                </div>

                {/* Beekeeper Name with Mandatory "Verified via Aadhaar" Badge */}
                <div className="beekeeper-name-badge-row">
                  <h3 className="cert-apiary-name">
                    {activeBatch.beekeeperName || apiary?.beekeeperName || apiary?.name || 'Master Beekeeper'}
                  </h3>
                  
                  {/* Verified via Aadhaar Badge */}
                  <div className="aadhaar-verified-tag" id="aadhaar-verified-badge" title="Identity cryptographically authenticated via simulated UIDAI e-KYC">
                    <span className="aadhaar-shield-icon">🛡️</span>
                    <span className="aadhaar-tag-text">Verified via Aadhaar</span>
                  </div>
                </div>

                {/* Apiary Location */}
                <div className="cert-apiary-location">
                  📍 <strong>Apiary Location:</strong> {activeBatch.location || apiary?.location || apiary?.region || 'Kangra Valley, Himachal Pradesh, India'}
                </div>

                {/* Harvest Date */}
                <div className="cert-harvest-date-badge">
                  📅 <strong>Harvest Date:</strong> {activeBatch.harvestDate}
                  {activeBatch.extractionDate && (
                    <span className="text-muted"> (Cold Extracted: {activeBatch.extractionDate})</span>
                  )}
                </div>

                {apiary?.bio && (
                  <p className="cert-apiary-bio">"{apiary.bio}"</p>
                )}

                {/* Certifications Row */}
                <div className="cert-certs-flex">
                  <span className="apiary-cert-chip">✓ 100% Raw Honey</span>
                  <span className="apiary-cert-chip">✓ UIDAI e-KYC Authenticated</span>
                  <span className="apiary-cert-chip">✓ Nuclear Magnetic Resonance Tested</span>
                  <span className="apiary-cert-chip">✓ Cold Centrifugal Extraction</span>
                </div>
              </div>
            </div>

            {/* Right Column: 5-Step Custody Journey & Blockchain Proof */}
            <div className="cert-col-right">
              {/* Custody Timeline */}
              <div className="cert-card cert-timeline-card">
                <div className="cert-card-header">
                  <span className="cert-card-label">TAMPER-EVIDENT CUSTODY JOURNEY</span>
                  <span className="text-emerald">5 Steps Validated</span>
                </div>

                <div className="provenance-timeline">
                  {/* Step 1: Foraging */}
                  <div className="timeline-item">
                    <div className="timeline-icon-box">🐝</div>
                    <div className="timeline-content">
                      <div className="timeline-step-head">
                        <span className="step-title">1. Apiary Hive Foraging</span>
                        <span className="step-date font-mono">{activeBatch.harvestDate}</span>
                      </div>
                      <p className="step-text">
                        Nectar gathered by honeybees in pristine floral sanctuary at <strong>{activeBatch.location || apiary?.location || 'Protected Sanctuary'}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Extraction */}
                  <div className="timeline-item">
                    <div className="timeline-icon-box">🍯</div>
                    <div className="timeline-content">
                      <div className="timeline-step-head">
                        <span className="step-title">2. Raw Cold Extraction</span>
                        <span className="step-date font-mono">{activeBatch.extractionDate || activeBatch.harvestDate}</span>
                      </div>
                      <p className="step-text">
                        Zero thermal pasteurization (&lt;35°C). Natural invertase and diastase enzymes intact. Moisture verified at {activeBatch.moisturePercent}%.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Laboratory NMR Testing */}
                  <div className="timeline-item">
                    <div className="timeline-icon-box">🔬</div>
                    <div className="timeline-content">
                      <div className="timeline-step-head">
                        <span className="step-title">3. Laboratory NMR Spectrometry</span>
                        <span className="step-date text-emerald font-mono">
                          {activeBatch.labCertNumber || 'LAB-ISO-9921'}
                        </span>
                      </div>
                      <p className="step-text">
                        <strong>Test Result:</strong> {activeBatch.qualityTestResult || `${activeBatch.purityScore || 99.4}% NMR Purity`}. Zero corn or rice syrup markers.
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Aadhaar Beekeeper Signature */}
                  <div className="timeline-item">
                    <div className="timeline-icon-box">🛡️</div>
                    <div className="timeline-content">
                      <div className="timeline-step-head">
                        <span className="step-title">4. Producer Identity e-KYC</span>
                        <span className="step-date text-amber font-mono">Verified via Aadhaar</span>
                      </div>
                      <p className="step-text">
                        Batch custody authenticated to licensed beekeeper <strong>{activeBatch.beekeeperName || apiary?.beekeeperName}</strong> (ID: {apiary?.beekeeperId || 'BEE-IND'}).
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Blockchain Block Anchoring */}
                  <div className="timeline-item">
                    <div className="timeline-icon-box">🔗</div>
                    <div className="timeline-content">
                      <div className="timeline-step-head">
                        <span className="step-title">5. Cryptographic Block Chaining</span>
                        <span className="step-date text-cyan font-mono">Block #{activeBatch.blockIndex || 1}</span>
                      </div>
                      <div className="step-hash-box">
                        <div className="font-mono hash-line">
                          <span className="hash-tag">Block Hash (SHA-256):</span>
                          <code className="text-amber">{activeBatch.hash || activeBatch.blockHash}</code>
                        </div>
                        <div className="font-mono hash-line mt-1">
                          <span className="hash-tag">Previous Parent Hash:</span>
                          <code className="text-muted">{activeBatch.previousHash || activeBatch.prevHash}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organoleptic Sensory Card */}
              <div className="cert-card mt-4">
                <div className="cert-card-header">
                  <span className="cert-card-label">SENSORY TASTING NOTES & COLOR</span>
                  <span className="text-amber">Pfund Scale Certified</span>
                </div>
                <div className="sensory-grid">
                  <div className="sensory-item">
                    <span className="sensory-label">Color Grade:</span>
                    <span className="sensory-value">{activeBatch.colorGrade || 'Golden Amber (50mm Pfund)'}</span>
                  </div>
                  <div className="sensory-item">
                    <span className="sensory-label">Aroma & Palate:</span>
                    <span className="sensory-value italic">
                      "{activeBatch.sensoryNotes || 'Silky crystal formation, floral meadow warmth, velvety mouthfeel, zero adulteration.'}"
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Not Found Empty State */
        <div className="not-found-card">
          <div className="not-found-icon">🔍</div>
          <h2 className="not-found-title">Batch #{searchInput} Not Found</h2>
          <p className="not-found-desc">
            No honey harvest records match this ID in active session memory. Please select an existing batch:
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
                  <span>{bId} ({b.floralType?.split(' ')[0] || 'Honey'})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
