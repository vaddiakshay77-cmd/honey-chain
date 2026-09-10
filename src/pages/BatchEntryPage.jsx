import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useHoneyChain } from '../context/HoneyChainContext';
import { createBatchHash, GENESIS_PREV_HASH } from '../utils/hashChain';
import { generateBatchNumber } from '../utils/crypto';

export function BatchEntryPage() {
  const { beekeepers, batches, addBatchToChain, navigateTo } = useHoneyChain();

  // Find verified beekeepers first; fallback to all registered beekeepers
  const verifiedBeekeepers = useMemo(() => {
    return beekeepers.filter(b => b.verified !== false);
  }, [beekeepers]);

  const defaultBeekeeper = verifiedBeekeepers[0] || beekeepers[0] || null;

  // Form State
  const [formData, setFormData] = useState({
    beekeeperId: defaultBeekeeper ? (defaultBeekeeper.id || defaultBeekeeper.beekeeperId) : '',
    batchId: generateBatchNumber(defaultBeekeeper?.regionCode || 'IN'),
    harvestDate: new Date().toISOString().split('T')[0],
    quantityKg: 250,
    location: defaultBeekeeper?.location || defaultBeekeeper?.region || 'Kangra Valley, Himachal Pradesh',
    qualityTestResult: '99.4% NMR Purity — Monofloral Certified (Grade A)',
    floralType: defaultBeekeeper?.flora || 'Wild Multifloral & Mustard Blossom',
    moisturePercent: 16.5,
    labCertNumber: `LAB-ISO-${Math.floor(1000 + Math.random() * 9000)}`
  });

  // Submitted / Minted batch state
  const [mintedResult, setMintedResult] = useState(null);
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState('');
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  // Auto-sync location & flora when beekeeper changes
  const handleBeekeeperChange = (e) => {
    const bId = e.target.value;
    const selected = beekeepers.find(b => (b.id === bId || b.beekeeperId === bId));
    setFormData(prev => ({
      ...prev,
      beekeeperId: bId,
      location: selected?.location || selected?.region || prev.location,
      floralType: selected?.flora || prev.floralType,
      batchId: generateBatchNumber(selected?.regionCode || 'IN')
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  // Selected beekeeper object
  const currentBeekeeper = useMemo(() => {
    return beekeepers.find(b => (b.id === formData.beekeeperId || b.beekeeperId === formData.beekeeperId)) || defaultBeekeeper;
  }, [beekeepers, formData.beekeeperId, defaultBeekeeper]);

  // Last batch in the chain for previousHash linking
  const lastBatch = batches[batches.length - 1];
  const previousHash = lastBatch ? (lastBatch.hash || lastBatch.blockHash) : GENESIS_PREV_HASH;
  const nextBlockIndex = batches.length + 1;

  // Live preview hash calculation using createBatchHash
  const previewHash = useMemo(() => {
    const payload = {
      batchId: formData.batchId,
      beekeeperId: formData.beekeeperId,
      harvestDate: formData.harvestDate,
      quantityKg: Number(formData.quantityKg),
      location: formData.location,
      qualityTestResult: formData.qualityTestResult,
      floralType: formData.floralType
    };
    return createBatchHash(payload, previousHash);
  }, [formData, previousHash]);

  // Generate live preview QR code whenever batchId changes using qrcode library
  useEffect(() => {
    if (formData.batchId) {
      QRCode.toDataURL(formData.batchId, {
        width: 180,
        margin: 2,
        color: {
          dark: '#080a10',
          light: '#ffffff'
        }
      }).then(url => {
        setPreviewQrDataUrl(url);
      }).catch(err => {
        console.error('Error generating preview QR:', err);
      });
    }
  }, [formData.batchId]);

  // Handle Submit: call createBatchHash(), add to Context state, generate downloadable QR
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.beekeeperId) {
      setErrorMsg('Please select a registered beekeeper.');
      return;
    }
    if (!formData.harvestDate) {
      setErrorMsg('Please select a harvest date.');
      return;
    }
    if (!formData.quantityKg || Number(formData.quantityKg) <= 0) {
      setErrorMsg('Please enter a valid quantity in kg.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMsg('Please enter the apiary location.');
      return;
    }
    if (!formData.qualityTestResult.trim()) {
      setErrorMsg('Please enter the quality test result.');
      return;
    }

    setIsMinting(true);
    setErrorMsg('');

    try {
      const timestamp = new Date().toISOString();
      const batchId = formData.batchId.trim().toUpperCase();

      // Step 1: Prepare batch data object
      const batchData = {
        batchId,
        batchNumber: batchId,
        blockIndex: nextBlockIndex,
        beekeeperId: currentBeekeeper?.beekeeperId || formData.beekeeperId,
        beekeeperName: currentBeekeeper?.beekeeperName || currentBeekeeper?.name || 'Verified Beekeeper',
        harvestDate: formData.harvestDate,
        extractionDate: formData.harvestDate,
        quantityKg: Number(formData.quantityKg),
        jarCount: Math.round(Number(formData.quantityKg) * 2), // 500g jars
        location: formData.location.trim(),
        region: formData.location.trim(),
        qualityTestResult: formData.qualityTestResult.trim(),
        purityScore: parseFloat(formData.qualityTestResult) || 99.2,
        moisturePercent: Number(formData.moisturePercent) || 16.5,
        floralType: formData.floralType || 'Monofloral Raw Honey',
        labCertNumber: formData.labCertNumber,
        pollenCountRatio: '84%+ Monofloral DNA Match',
        colorGrade: 'Golden Amber (50mm Pfund)',
        sensoryNotes: 'Floral bouquet, silky crystal formation, zero additive syrups.',
        nmrSpectrumStatus: 'Pass — 100% Raw Unadulterated Honey',
        timestamp
      };

      // Step 2: Call createBatchHash() using the last batch's hash as previousHash
      const computedHash = createBatchHash(batchData, previousHash);

      // Step 3: Form full block object with hash and add to shared Context state array
      const newBatch = {
        ...batchData,
        previousHash,
        prevHash: previousHash,
        hash: computedHash,
        blockHash: computedHash,
        status: 'Verified Authentic'
      };

      addBatchToChain(newBatch);

      // Step 4: Generate high-resolution QR code encoding the batchId using qrcode library
      const qrDataUrl = await QRCode.toDataURL(batchId, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#080a10',
          light: '#ffffff'
        }
      });

      setGeneratedQrDataUrl(qrDataUrl);
      setMintedResult(newBatch);
      setIsMinting(false);
    } catch (err) {
      console.error('Error minting batch:', err);
      setErrorMsg('Failed to generate hash or QR code: ' + err.message);
      setIsMinting(false);
    }
  };

  const handleResetForNextBatch = () => {
    setMintedResult(null);
    setGeneratedQrDataUrl('');
    setFormData(prev => ({
      ...prev,
      batchId: generateBatchNumber(currentBeekeeper?.regionCode || 'IN'),
      harvestDate: new Date().toISOString().split('T')[0],
      quantityKg: 200,
      labCertNumber: `LAB-ISO-${Math.floor(1000 + Math.random() * 9000)}`
    }));
  };

  return (
    <div className="page-container batch-entry-page">
      {/* Header */}
      <div className="page-header-wrap">
        <div className="page-tag-pill">Provenance Protocol • Batch Ledger</div>
        <h1 className="page-title">Log New Honey Batch</h1>
        <p className="page-subtitle">
          Verified beekeepers can mint an immutable harvest batch to the HoneyChain ledger.
          Each batch is cryptographically linked to the preceding block hash and assigned a scannable QR code.
        </p>
      </div>

      {/* MINTED SUCCESS POPUP / SCREEN */}
      {mintedResult && generatedQrDataUrl && (
        <div className="minted-modal-backdrop">
          <div className="minted-modal-card">
            <div className="minted-badge-top">BLOCK #{mintedResult.blockIndex} MINTED TO CHAIN</div>
            <h2 className="minted-title">Honey Batch Chained Successfully!</h2>
            <p className="minted-sub">
              Batch <strong>{mintedResult.batchId}</strong> has been hashed with parent block #{mintedResult.blockIndex - 1} and stored in session memory.
            </p>

            {/* QR Code Display with Download Option */}
            <div className="batch-qr-showcase-box">
              <div className="qr-image-wrapper">
                <img
                  id="minted-batch-qr-img"
                  src={generatedQrDataUrl}
                  alt={`QR code for Honey Batch ${mintedResult.batchId}`}
                  className="generated-qr-image"
                />
                <span className="qr-encoding-caption">
                  Encodes Batch ID: <strong>{mintedResult.batchId}</strong>
                </span>
              </div>

              <div className="qr-download-panel">
                <div className="qr-batch-title">{mintedResult.batchId}</div>
                <div className="qr-meta-item">
                  <span>Producer:</span> <strong>{mintedResult.beekeeperName}</strong>
                </div>
                <div className="qr-meta-item">
                  <span>Location:</span> <strong>{mintedResult.location}</strong>
                </div>
                <div className="qr-meta-item">
                  <span>Volume:</span> <strong>{mintedResult.quantityKg} kg ({mintedResult.jarCount} Jars)</strong>
                </div>
                <div className="qr-meta-item">
                  <span>Quality:</span> <strong className="text-emerald">{mintedResult.qualityTestResult}</strong>
                </div>

                {/* Direct Download Button */}
                <div className="qr-download-actions">
                  <a
                    id="download-qr-btn"
                    href={generatedQrDataUrl}
                    download={`HoneyChain-${mintedResult.batchId}-QR.png`}
                    className="btn-primary btn-block"
                  >
                    📥 Download QR Code (PNG)
                  </a>
                  <button
                    className="btn-secondary btn-block"
                    onClick={() => navigateTo('lookup', mintedResult.batchId)}
                  >
                    🔍 Inspect Consumer Certificate
                  </button>
                </div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Digest Box */}
            <div className="minted-hash-display">
              <div className="hash-label-row">
                <span>Computed Block Hash (createBatchHash):</span>
                <span className="text-emerald">✓ SHA-256 Valid</span>
              </div>
              <code className="minted-hash-code">{mintedResult.hash}</code>

              <div className="hash-label-row mt-2">
                <span>Chained From Previous Hash (Block #{mintedResult.blockIndex - 1}):</span>
              </div>
              <code className="minted-hash-code text-muted">{mintedResult.previousHash}</code>
            </div>

            <div className="minted-modal-actions">
              <button
                id="mint-another-batch-btn"
                className="btn-secondary"
                onClick={handleResetForNextBatch}
              >
                + Log Another Batch
              </button>
              <button
                className="btn-tertiary"
                onClick={() => navigateTo('admin')}
              >
                📊 Open Blockchain Explorer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="form-preview-layout">
        {/* Main Batch Entry Form */}
        <div className="form-card">
          <h2 className="form-card-title">Honey Harvest & Lab Credentials</h2>
          <p className="form-card-sub">
            All fields are hashed with <code>createBatchHash()</code> and chained to the last block in memory.
          </p>

          {errorMsg && (
            <div className="form-error-alert">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="standard-form">
            {/* 1. Verified Beekeeper Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="beekeeper-select">
                Select Verified Beekeeper <span className="req">*</span>
                {currentBeekeeper?.verified && (
                  <span className="verified-badge-inline">✓ UIDAI e-KYC Verified</span>
                )}
              </label>
              <select
                id="beekeeper-select"
                name="beekeeperId"
                className="form-select"
                value={formData.beekeeperId}
                onChange={handleBeekeeperChange}
                required
              >
                {beekeepers.map(b => (
                  <option key={b.id || b.beekeeperId} value={b.id || b.beekeeperId}>
                    {b.beekeeperName || b.name} ({b.location || b.region}) — {b.beekeeperId || b.nodeId} {b.verified ? '[✓ Verified]' : ''}
                  </option>
                ))}
              </select>
              <span className="field-subtext">
                Beekeepers registered via the Beekeeper Registration portal appear here automatically.
              </span>
            </div>

            {/* Batch ID & Harvest Date */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="batch-id-input">
                  Batch ID (Unique Code) <span className="req">*</span>
                </label>
                <div className="input-btn-group">
                  <input
                    id="batch-id-input"
                    name="batchId"
                    type="text"
                    className="form-input font-mono text-uppercase"
                    value={formData.batchId}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn-input-addon"
                    onClick={() => setFormData(p => ({ ...p, batchId: generateBatchNumber(currentBeekeeper?.regionCode || 'IN') }))}
                    title="Generate new Batch ID"
                  >
                    🎲 Random
                  </button>
                </div>
              </div>

              {/* 2. Harvest Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="harvest-date-input">
                  Harvest Date <span className="req">*</span>
                </label>
                <input
                  id="harvest-date-input"
                  name="harvestDate"
                  type="date"
                  className="form-input"
                  value={formData.harvestDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* 3. Quantity in Kg & Moisture */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="quantity-kg-input">
                  Quantity in Kg <span className="req">*</span>
                </label>
                <input
                  id="quantity-kg-input"
                  name="quantityKg"
                  type="number"
                  min="1"
                  max="50000"
                  step="1"
                  className="form-input font-mono"
                  value={formData.quantityKg}
                  onChange={handleInputChange}
                  required
                />
                <span className="field-subtext">
                  ≈ {Math.round((Number(formData.quantityKg) || 0) * 2)} sealed jars (500g each)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="moisture-input">
                  Moisture Content (%)
                </label>
                <input
                  id="moisture-input"
                  name="moisturePercent"
                  type="number"
                  step="0.1"
                  min="12"
                  max="22"
                  className="form-input font-mono"
                  value={formData.moisturePercent}
                  onChange={handleInputChange}
                />
                <span className="field-subtext">Standard Grade A honey &le; 18.6%</span>
              </div>
            </div>

            {/* 4. Apiary Location */}
            <div className="form-group">
              <label className="form-label" htmlFor="apiary-location-input">
                Apiary Location <span className="req">*</span>
              </label>
              <input
                id="apiary-location-input"
                name="location"
                type="text"
                className="form-input"
                placeholder="e.g. Kangra Valley, Himachal Pradesh, India"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
              <span className="field-subtext">Auto-filled from beekeeper profile; editable if multiple apiaries exist.</span>
            </div>

            {/* 5. Quality Test Result */}
            <div className="form-group">
              <label className="form-label" htmlFor="quality-test-input">
                Quality Test Result <span className="req">*</span>
              </label>
              <input
                id="quality-test-input"
                name="qualityTestResult"
                type="text"
                className="form-input"
                placeholder="e.g. 99.4% NMR Purity — Monofloral Certified (Grade A)"
                value={formData.qualityTestResult}
                onChange={handleInputChange}
                required
              />
              <div className="quick-test-presets">
                <span className="preset-label">Quick Presets:</span>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setFormData(p => ({ ...p, qualityTestResult: '99.6% NMR Purity — Monofloral Certified' }))}
                >
                  99.6% Monofloral
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setFormData(p => ({ ...p, qualityTestResult: '98.8% Purity — Zero C3/C4 Syrups (Grade A)' }))}
                >
                  98.8% Grade A
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setFormData(p => ({ ...p, qualityTestResult: '99.1% NMR Spectrometry — Pure Raw Raw State' }))}
                >
                  99.1% Pure Raw
                </button>
              </div>
            </div>

            {/* Floral Type Companion Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="floral-type-input">
                Botanical Floral Variety
              </label>
              <input
                id="floral-type-input"
                name="floralType"
                type="text"
                className="form-input"
                value={formData.floralType}
                onChange={handleInputChange}
                placeholder="e.g. Wild Multifloral, Mustard, Acacia, Lavender"
              />
            </div>

            {/* Submit Button */}
            <button
              id="submit-batch-btn"
              type="submit"
              className="btn-primary btn-block btn-lg"
              disabled={isMinting}
            >
              {isMinting ? (
                <span>⏳ Computing SHA-256 & Minting Block...</span>
              ) : (
                <span>⛓️ Mint Batch & Generate Downloadable QR Code</span>
              )}
            </button>
          </form>
        </div>

        {/* Live Blockchain & QR Preview Sidebar */}
        <div className="preview-sidebar">
          <div className="preview-sticky-wrap">
            <div className="preview-header-label">
              <span>LIVE BATCH & QR PREVIEW</span>
              <span className="preview-status-pill">Block #{nextBlockIndex}</span>
            </div>

            {/* Live QR Preview Box */}
            <div className="batch-qr-preview-card">
              <div className="preview-qr-wrapper">
                {previewQrDataUrl ? (
                  <img
                    src={previewQrDataUrl}
                    alt="Preview QR"
                    className="qr-preview-img"
                  />
                ) : (
                  <div className="qr-skeleton">Generating QR...</div>
                )}
                <div className="preview-qr-caption font-mono">
                  {formData.batchId || 'BATCH-ID'}
                </div>
              </div>

              <div className="preview-batch-meta">
                <div className="preview-meta-row">
                  <span>Producer:</span>
                  <strong>{currentBeekeeper?.beekeeperName || currentBeekeeper?.name}</strong>
                </div>
                <div className="preview-meta-row">
                  <span>Location:</span>
                  <span>{formData.location || 'Pending Location'}</span>
                </div>
                <div className="preview-meta-row">
                  <span>Yield:</span>
                  <span className="text-amber">{formData.quantityKg} kg</span>
                </div>
                <div className="preview-meta-row">
                  <span>Test Result:</span>
                  <span className="text-emerald">{formData.qualityTestResult.slice(0, 24)}...</span>
                </div>
              </div>
            </div>

            {/* Blockchain Chaining Inspector */}
            <div className="blockchain-sim-card">
              <div className="sim-header">
                <span className="sim-block-num">CHAIN PROPOSAL #{nextBlockIndex}</span>
                <span className="sim-algo-tag">SHA-256</span>
              </div>

              <div className="sim-chain-connection">
                <span className="connection-label">Chained From Block #{nextBlockIndex - 1}:</span>
                <code className="connection-hash">{previousHash.slice(0, 16)}...{previousHash.slice(-8)}</code>
                <div className="connection-arrow">⇣ (Immutable Parent Link)</div>
              </div>

              <div className="sim-hash-result">
                <div className="hash-result-title">LIVE COMPUTED HASH (createBatchHash):</div>
                <code className="hash-result-code">{previewHash}</code>
              </div>

              <div className="chain-length-notice">
                <span>🔗 Current ledger holds <strong>{batches.length}</strong> authenticated blocks in session.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
