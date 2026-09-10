import React, { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { useHoneyChain } from '../context/HoneyChainContext';
import { createBatchHash, GENESIS_PREV_HASH } from '../utils/hashChain';
import { generateBatchNumber } from '../utils/crypto';

export function BatchEntryPage() {
  const { beekeepers, batches, addBatchToChain, navigateTo } = useHoneyChain();

  // Filter only verified beekeepers
  const verifiedBeekeepers = useMemo(() => {
    return beekeepers.filter(b => b.verified === true);
  }, [beekeepers]);

  const defaultBeekeeper = verifiedBeekeepers[0] || null;

  // Form fields: dropdown for verified beekeeper, harvest date, quantity (kg), quality test result
  const [formData, setFormData] = useState({
    beekeeperId: defaultBeekeeper ? (defaultBeekeeper.beekeeperId || defaultBeekeeper.id) : '',
    harvestDate: new Date().toISOString().split('T')[0],
    quantityKg: '',
    qualityTestResult: '99.4% NMR Purity — Grade A Raw Honey'
  });

  const [mintedBatch, setMintedBatch] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected beekeeper object
  const selectedBeekeeper = useMemo(() => {
    return verifiedBeekeepers.find(b => (b.beekeeperId === formData.beekeeperId || b.id === formData.beekeeperId)) || defaultBeekeeper;
  }, [verifiedBeekeepers, formData.beekeeperId, defaultBeekeeper]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  // On submit: call createBatchHash using previous batch's hash, add to Context, display QR code
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.beekeeperId) {
      setErrorMsg('Please select a verified beekeeper from the dropdown.');
      return;
    }
    if (!formData.harvestDate) {
      setErrorMsg('Please specify a harvest date.');
      return;
    }
    if (!formData.quantityKg || Number(formData.quantityKg) <= 0) {
      setErrorMsg('Please enter a valid quantity in kg.');
      return;
    }
    if (!formData.qualityTestResult.trim()) {
      setErrorMsg('Please provide the quality test result.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Get previous batch hash
      const previousBatch = batches.length > 0 ? batches[batches.length - 1] : null;
      const previousHash = previousBatch ? (previousBatch.hash || previousBatch.blockHash) : GENESIS_PREV_HASH;
      const blockIndex = batches.length + 1;

      // 2. Generate unique batchId
      const batchId = generateBatchNumber(selectedBeekeeper?.regionCode || 'IN');
      const timestamp = new Date().toISOString();

      // 3. Prepare payload for hashing
      const batchPayload = {
        batchId,
        blockIndex,
        beekeeperId: selectedBeekeeper?.beekeeperId || formData.beekeeperId,
        beekeeperName: selectedBeekeeper?.name || selectedBeekeeper?.beekeeperName || 'Verified Apiary',
        harvestDate: formData.harvestDate,
        quantityKg: Number(formData.quantityKg),
        qualityTestResult: formData.qualityTestResult.trim(),
        location: selectedBeekeeper?.location || selectedBeekeeper?.region || 'India',
        timestamp
      };

      // 4. Call hash function using previous batch's hash
      const blockHash = createBatchHash(batchPayload, previousHash);

      // 5. Create full batch block
      const newBatch = {
        ...batchPayload,
        batchNumber: batchId,
        purityScore: parseFloat(formData.qualityTestResult) || 99.4,
        moisturePercent: 16.5,
        floralType: selectedBeekeeper?.flora || 'Monofloral Wild Raw Honey',
        previousHash,
        prevHash: previousHash,
        hash: blockHash,
        blockHash,
        status: 'Verified Authentic'
      };

      // 6. Add new batch to Context
      addBatchToChain(newBatch);

      // 7. Generate QR code encoding the batchId
      const qrUrl = await QRCode.toDataURL(batchId, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#080a10',
          light: '#ffffff'
        }
      });

      setQrCodeDataUrl(qrUrl);
      setMintedBatch(newBatch);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error logging batch:', err);
      setErrorMsg('Failed to create batch: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMintedBatch(null);
    setQrCodeDataUrl('');
    setFormData({
      beekeeperId: defaultBeekeeper ? (defaultBeekeeper.beekeeperId || defaultBeekeeper.id) : '',
      harvestDate: new Date().toISOString().split('T')[0],
      quantityKg: '',
      qualityTestResult: '99.4% NMR Purity — Grade A Raw Honey'
    });
    setErrorMsg('');
  };

  return (
    <div className="page-container batch-entry-page">
      {/* Header */}
      <div className="page-header-wrap">
        <div className="page-tag-pill">Provenance Protocol • Batch Minting</div>
        <h1 className="page-title">Batch Entry</h1>
        <p className="page-subtitle">
          Record a new honey harvest batch. Each batch is cryptographically linked to the previous batch hash
          and assigned a verifiable QR code.
        </p>
      </div>

      <div className="form-card-container">
        {/* POST-SUBMISSION: DISPLAY QR CODE & DETAILS */}
        {mintedBatch && qrCodeDataUrl ? (
          <div className="form-card text-center success-batch-card">
            <div className="success-icon-badge">⛓️</div>
            <h2 className="form-card-title">Batch Minted Successfully!</h2>
            <p className="form-card-sub">
              Batch <strong className="text-amber">{mintedBatch.batchId}</strong> has been added to the blockchain ledger (Block #{mintedBatch.blockIndex}).
            </p>

            {/* Display QR Code encoding batchId */}
            <div className="qr-display-box" id="minted-qr-display">
              <div className="qr-image-wrapper">
                <img
                  id="batch-qr-code-img"
                  src={qrCodeDataUrl}
                  alt={`QR code for batch ${mintedBatch.batchId}`}
                  className="batch-qr-image"
                />
              </div>
              <div className="qr-encoding-info">
                <div className="qr-tag-label">ENCODED BATCH ID</div>
                <div className="qr-encoded-id font-mono text-amber">{mintedBatch.batchId}</div>
                <div className="qr-scan-instruction">
                  Scan this QR code with any smartphone to inspect batch authenticity on Consumer Lookup.
                </div>
              </div>
            </div>

            {/* Batch summary details */}
            <div className="batch-summary-strip">
              <div className="summary-item">
                <span className="summary-lbl">Beekeeper:</span>
                <span className="summary-val">{mintedBatch.beekeeperName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-lbl">Harvest Date:</span>
                <span className="summary-val">{mintedBatch.harvestDate}</span>
              </div>
              <div className="summary-item">
                <span className="summary-lbl">Quantity:</span>
                <span className="summary-val">{mintedBatch.quantityKg} kg</span>
              </div>
              <div className="summary-item">
                <span className="summary-lbl">Quality Result:</span>
                <span className="summary-val text-emerald">{mintedBatch.qualityTestResult}</span>
              </div>
            </div>

            {/* Cryptographic Link Proof */}
            <div className="batch-crypto-summary font-mono">
              <div className="crypto-hash-row">
                <span className="hash-lbl">Previous Batch Hash:</span>
                <span className="hash-val text-muted">{mintedBatch.previousHash?.slice(0, 20)}...{mintedBatch.previousHash?.slice(-10)}</span>
              </div>
              <div className="crypto-hash-row">
                <span className="hash-lbl">Computed Batch Hash:</span>
                <span className="hash-val text-amber">{mintedBatch.hash?.slice(0, 20)}...{mintedBatch.hash?.slice(-10)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="success-actions-row">
              <button
                id="view-in-lookup-btn"
                className="btn-primary btn-lg"
                onClick={() => navigateTo('lookup', mintedBatch.batchId)}
              >
                <span>🔍 Open in Consumer Lookup →</span>
              </button>
              <a
                href={qrCodeDataUrl}
                download={`${mintedBatch.batchId}-qrcode.png`}
                className="btn-secondary"
              >
                <span>💾 Download QR Image</span>
              </a>
              <button
                className="btn-tertiary"
                onClick={handleReset}
              >
                <span>+ Log Another Batch</span>
              </button>
            </div>
          </div>
        ) : (
          /* BATCH ENTRY FORM */
          <div className="form-card">
            <h2 className="form-card-title">Honey Harvest Details</h2>
            <p className="form-card-sub">
              Select an authenticated beekeeper and record harvest metrics to calculate the cryptographic block hash.
            </p>

            {errorMsg && (
              <div className="form-error-alert">
                <span>⚠️ {errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="standard-form">
              {/* Dropdown to pick a verified beekeeper */}
              <div className="form-group">
                <label className="form-label" htmlFor="batch-beekeeper-select">
                  Select Verified Beekeeper <span className="req">*</span>
                </label>
                <select
                  id="batch-beekeeper-select"
                  name="beekeeperId"
                  className="form-input"
                  value={formData.beekeeperId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>-- Select a verified beekeeper --</option>
                  {verifiedBeekeepers.map(b => (
                    <option key={b.beekeeperId || b.id} value={b.beekeeperId || b.id}>
                      {b.name || b.beekeeperName} ({b.beekeeperId || b.id}) — Verified ✓
                    </option>
                  ))}
                </select>
                <span className="field-subtext">
                  Only UIDAI / e-KYC verified beekeepers with verified=true are eligible to mint batches
                </span>
              </div>

              {/* Harvest Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="batch-harvest-date">
                  Harvest Date <span className="req">*</span>
                </label>
                <input
                  id="batch-harvest-date"
                  name="harvestDate"
                  type="date"
                  className="form-input"
                  value={formData.harvestDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Quantity (kg) */}
              <div className="form-group">
                <label className="form-label" htmlFor="batch-quantity">
                  Quantity (kg) <span className="req">*</span>
                </label>
                <input
                  id="batch-quantity"
                  name="quantityKg"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-input font-mono"
                  placeholder="e.g. 250"
                  value={formData.quantityKg}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Quality Test Result */}
              <div className="form-group">
                <label className="form-label" htmlFor="batch-quality-result">
                  Quality Test Result <span className="req">*</span>
                </label>
                <input
                  id="batch-quality-result"
                  name="qualityTestResult"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 99.4% NMR Purity — Monofloral Grade A"
                  value={formData.qualityTestResult}
                  onChange={handleInputChange}
                  required
                />
                <span className="field-subtext">
                  Laboratory NMR spectrometry, pollen DNA count, or purity test grade
                </span>
              </div>

              {/* Submit Button */}
              <button
                id="batch-submit-btn"
                type="submit"
                className="btn-primary btn-block btn-lg mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>⏳ Calculating Hash & Minting Batch...</span>
                ) : (
                  <span>⛓️ Calculate Hash & Mint Batch</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
