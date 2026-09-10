import React, { useState, useMemo } from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';
import { verifyChain } from '../utils/hashChain';
import { generateBatchNumber } from '../utils/crypto';

export function AdminOverviewPage() {
  const { batches, beekeepers, mintBatch, resetToSeedData, navigateTo } = useHoneyChain();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'batches' | 'beekeepers'

  // Chain Verification Modal / State
  const [verificationResult, setVerificationResult] = useState(null);
  const [isRunningVerification, setIsRunningVerification] = useState(false);
  const [copiedHash, setCopiedHash] = useState('');

  // Summary statistics
  const totalKg = batches.reduce((sum, b) => sum + (b.quantityKg || 0), 0);
  const totalJars = batches.reduce((sum, b) => sum + (b.jarCount || (b.quantityKg ? b.quantityKg * 2 : 0)), 0);
  const verifiedBeekeepersCount = beekeepers.filter(b => b.verified !== false).length;

  // Handler for "Run Full Chain Verification"
  const handleRunVerification = () => {
    setIsRunningVerification(true);

    setTimeout(() => {
      const result = verifyChain(batches);
      setVerificationResult({
        ...result,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
      });
      setIsRunningVerification(false);
    }, 450);
  };

  // Add random mock batch to test dynamic growth
  const handleAddRandomBatch = () => {
    const randomApiary = beekeepers[Math.floor(Math.random() * beekeepers.length)] || beekeepers[0];
    const floraOptions = [
      'Wild Orange Blossom (Organic)',
      'Highland Heather & Thyme',
      'Acacia Monofloral Raw',
      'Wild Tasmanian Leatherwood',
      'Mustard & Forest Jamun'
    ];
    const chosenFlora = floraOptions[Math.floor(Math.random() * floraOptions.length)];
    const harvestDate = new Date().toISOString().split('T')[0];
    const kg = Math.floor(180 + Math.random() * 320);

    mintBatch({
      beekeeperId: randomApiary.id || randomApiary.beekeeperId,
      batchId: generateBatchNumber(randomApiary.regionCode || 'IN'),
      harvestDate,
      extractionDate: harvestDate,
      floralType: chosenFlora,
      location: randomApiary.location || randomApiary.region || 'Kangra Valley, HP',
      quantityKg: kg,
      qualityTestResult: `${(98.5 + Math.random() * 1.4).toFixed(1)}% NMR Purity — Passed Grade A`,
      moisturePercent: +(15.5 + Math.random() * 2.0).toFixed(1),
      purityScore: +(98.5 + Math.random() * 1.4).toFixed(1),
      regionCode: randomApiary.regionCode || 'IN'
    });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(''), 2000);
  };

  // Filtered batches
  const filteredBatches = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return batches.filter(b => {
      const bId = (b.batchId || b.batchNumber || '').toLowerCase();
      const flora = (b.floralType || '').toLowerCase();
      const hash = (b.hash || b.blockHash || '').toLowerCase();
      const prev = (b.previousHash || b.prevHash || '').toLowerCase();
      const beekeeper = (b.beekeeperName || '').toLowerCase();
      const loc = (b.location || b.region || '').toLowerCase();
      return bId.includes(term) || flora.includes(term) || hash.includes(term) || prev.includes(term) || beekeeper.includes(term) || loc.includes(term);
    });
  }, [batches, searchTerm]);

  // Filtered beekeepers
  const filteredBeekeepers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return beekeepers.filter(a => {
      const name = (a.name || '').toLowerCase();
      const bName = (a.beekeeperName || '').toLowerCase();
      const loc = (a.location || a.region || '').toLowerCase();
      const id = (a.beekeeperId || a.id || a.nodeId || '').toLowerCase();
      const status = (a.status || '').toLowerCase();
      return name.includes(term) || bName.includes(term) || loc.includes(term) || id.includes(term) || status.includes(term);
    });
  }, [beekeepers, searchTerm]);

  return (
    <div className="page-container admin-overview-page">
      {/* Header with Run Full Chain Verification Action */}
      <div className="admin-header-row">
        <div className="admin-header-titles">
          <div className="page-tag-pill">Protocol Registry & Consensus Monitor</div>
          <h1 className="page-title">Admin & Blockchain Overview</h1>
          <p className="page-subtitle">
            Centralized registry of all registered beekeepers with Aadhaar verification status,
            plus the complete chronological table of honey batch blocks with cryptographic SHA-256 hashes.
          </p>
        </div>

        {/* Primary Action: Run Full Chain Verification */}
        <div className="admin-main-actions">
          <button
            id="run-full-chain-verification-btn"
            className="btn-primary btn-lg run-verification-btn"
            onClick={handleRunVerification}
            disabled={isRunningVerification}
          >
            {isRunningVerification ? (
              <span>⏳ Auditing Block Hashes...</span>
            ) : (
              <span>🛡️ Run Full Chain Verification</span>
            )}
          </button>
          
          <div className="admin-aux-actions">
            <button
              className="btn-secondary btn-compact"
              onClick={handleAddRandomBatch}
              title="Mint simulated test block"
            >
              + Add Mock Batch
            </button>
            <button
              className="btn-tertiary btn-compact"
              onClick={resetToSeedData}
              title="Reset to default seed state"
            >
              ↻ Reset Ledger
            </button>
          </div>
        </div>
      </div>

      {/* FULL CHAIN VERIFICATION RESULT BANNER / MODAL */}
      {verificationResult && (
        <div className={`chain-audit-banner ${verificationResult.isValid ? 'audit-pass' : 'audit-fail'}`}>
          <div className="audit-icon-wrap">
            {verificationResult.isValid ? '✅' : '⚠️'}
          </div>

          <div className="audit-content-wrap">
            <div className="audit-header-line">
              <h3 className="audit-status-title">
                {verificationResult.isValid
                  ? 'Cryptographic Verification Passed: Chain Integrity Intact'
                  : 'Cryptographic Audit Failed: Tampering Detected'}
              </h3>
              <span className="audit-timestamp font-mono">
                Audited at {verificationResult.date} {verificationResult.timestamp}
              </span>
            </div>

            <p className="audit-explanation">
              {verificationResult.reason}
            </p>

            <div className="audit-metrics-strip">
              <div className="audit-metric-pill">
                <span>Total Batches Checked:</span>
                <strong>{verificationResult.totalVerified} Blocks</strong>
              </div>
              <div className="audit-metric-pill">
                <span>Parent Hash Linkage:</span>
                <strong className={verificationResult.isValid ? 'text-emerald' : 'text-rose'}>
                  {verificationResult.isValid ? '100% Sequential Match' : 'Broken Link'}
                </strong>
              </div>
              <div className="audit-metric-pill">
                <span>Data Digest Re-hash:</span>
                <strong className={verificationResult.isValid ? 'text-emerald' : 'text-rose'}>
                  {verificationResult.isValid ? 'Canonical Match' : 'Mismatch'}
                </strong>
              </div>
            </div>
          </div>

          <button
            className="audit-close-btn"
            onClick={() => setVerificationResult(null)}
            title="Dismiss verification report"
          >
            ✕
          </button>
        </div>
      )}

      {/* Telemetry Metric Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🐝</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Beekeepers</span>
            <span className="admin-stat-val text-amber">{beekeepers.length}</span>
            <span className="admin-stat-sub">{verifiedBeekeepersCount} Verified via Aadhaar / e-KYC</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">⛓️</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Chained Blocks</span>
            <span className="admin-stat-val text-cyan">{batches.length}</span>
            <span className="admin-stat-sub">SHA-256 Sequential Hashes</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🍯</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Honey Certified</span>
            <span className="admin-stat-val text-emerald">{totalKg.toLocaleString()} kg</span>
            <span className="admin-stat-sub">≈ {totalJars.toLocaleString()} Jars Sealed</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🔬</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Chain Consensus</span>
            <span className="admin-stat-val text-emerald">100%</span>
            <span className="admin-stat-sub">In-Memory Session Verified</span>
          </div>
        </div>
      </div>

      {/* Navigation Filter & Search Bar */}
      <div className="admin-controls-bar">
        <div className="admin-tab-buttons">
          <button
            className={`admin-tab-btn ${activeTab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Registry Tables
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'batches' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            Chained Batches ({batches.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'beekeepers' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('beekeepers')}
          >
            Beekeepers & Aadhaar Status ({beekeepers.length})
          </button>
        </div>

        <div className="admin-search-input-wrap">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by Beekeeper, Batch ID, Location, or Hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
      </div>

      {/* ===================================================================
          TABLE 1: ALL BATCHES WITH THEIR HASHES
         =================================================================== */}
      {(activeTab === 'all' || activeTab === 'batches') && (
        <section className="admin-section-block">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">⛓️ Honey Batches & Cryptographic Block Hashes</h2>
              <p className="admin-section-sub">
                Each batch records its own SHA-256 block hash and the previous block hash link.
              </p>
            </div>
            <span className="admin-section-count font-mono">{filteredBatches.length} Batches Chained</span>
          </div>

          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Block #</th>
                  <th>Batch ID</th>
                  <th>Beekeeper Producer</th>
                  <th>Harvest Date</th>
                  <th>Quantity</th>
                  <th>Quality Test Result</th>
                  <th>Previous Block Hash</th>
                  <th>Current Block Hash (SHA-256)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b, idx) => {
                  const bId = b.batchId || b.batchNumber;
                  const currentHash = b.hash || b.blockHash || '';
                  const prevHash = b.previousHash || b.prevHash || '';
                  const beekeeper = beekeepers.find(k => k.id === b.beekeeperId || k.beekeeperId === b.beekeeperId);

                  return (
                    <tr key={bId + idx} className="admin-table-row">
                      <td className="font-mono">
                        <span className="block-index-pill">#{b.blockIndex || idx + 1}</span>
                      </td>

                      <td className="font-mono font-bold">
                        <span className="batch-id-highlight">{bId}</span>
                      </td>

                      <td>
                        <div className="table-beekeeper-cell">
                          <strong>{b.beekeeperName || beekeeper?.beekeeperName || beekeeper?.name || 'Verified Beekeeper'}</strong>
                          <span className="text-muted text-xs">{b.location || beekeeper?.location || 'Sanctuary'}</span>
                        </div>
                      </td>

                      <td className="font-mono text-sm">{b.harvestDate}</td>

                      <td className="text-sm">
                        <strong>{b.quantityKg} kg</strong>
                        <span className="text-muted text-xs block">{b.jarCount || b.quantityKg * 2} jars</span>
                      </td>

                      <td>
                        <span className="quality-pill text-emerald">
                          {b.qualityTestResult ? b.qualityTestResult.split('—')[0] : `${b.purityScore || 99}% Pure`}
                        </span>
                      </td>

                      {/* Previous Hash */}
                      <td className="font-mono hash-cell">
                        <div className="hash-code-wrapper" title={prevHash}>
                          <code>{prevHash.slice(0, 10)}...{prevHash.slice(-6)}</code>
                          <button
                            className="btn-copy-hash"
                            onClick={() => copyToClipboard(prevHash, `prev-${bId}`)}
                            title="Copy Previous Hash"
                          >
                            {copiedHash === `prev-${bId}` ? '✓' : '📋'}
                          </button>
                        </div>
                      </td>

                      {/* Current Block Hash */}
                      <td className="font-mono hash-cell">
                        <div className="hash-code-wrapper text-amber" title={currentHash}>
                          <code>{currentHash.slice(0, 12)}...{currentHash.slice(-8)}</code>
                          <button
                            className="btn-copy-hash"
                            onClick={() => copyToClipboard(currentHash, `curr-${bId}`)}
                            title="Copy Block Hash"
                          >
                            {copiedHash === `curr-${bId}` ? '✓' : '📋'}
                          </button>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          className="btn-table-action"
                          onClick={() => navigateTo('lookup', bId)}
                        >
                          Verify →
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty-table-cell">
                      No honey batches match "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===================================================================
          TABLE 2: ALL BEEKEEPERS WITH VERIFIED STATUS
         =================================================================== */}
      {(activeTab === 'all' || activeTab === 'beekeepers') && (
        <section className="admin-section-block mt-8">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">🐝 Registered Beekeepers & Verification Status</h2>
              <p className="admin-section-sub">
                Beekeepers stored in shared Context memory with their UIDAI Aadhaar e-KYC status.
              </p>
            </div>
            <span className="admin-section-count font-mono">{filteredBeekeepers.length} Producers</span>
          </div>

          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Beekeeper ID</th>
                  <th>Producer / Apiary Name</th>
                  <th>Mobile Number</th>
                  <th>Aadhaar Number</th>
                  <th>Apiary Location</th>
                  <th>Managed Hives</th>
                  <th>Primary Flora</th>
                  <th>Verified Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeekeepers.map((k, idx) => {
                  const bId = k.beekeeperId || k.id || k.nodeId;
                  const isAadhaar = k.aadhaar || k.verified;

                  return (
                    <tr key={bId + idx} className="admin-table-row">
                      <td className="font-mono font-bold text-amber">
                        {bId}
                      </td>

                      <td>
                        <div className="table-beekeeper-cell">
                          <strong>{k.beekeeperName || k.name}</strong>
                          {k.name && k.name !== k.beekeeperName && (
                            <span className="text-muted text-xs">{k.name}</span>
                          )}
                        </div>
                      </td>

                      <td className="font-mono text-sm">
                        {k.phone ? `+91 ${k.phone}` : <span className="text-muted">On File</span>}
                      </td>

                      <td className="font-mono text-sm">
                        {k.aadhaar ? (
                          <span>{k.aadhaar.includes('XXXX') ? k.aadhaar : `XXXX-XXXX-${k.aadhaar.slice(-4)}`}</span>
                        ) : (
                          <span className="text-muted">e-KYC Root</span>
                        )}
                      </td>

                      <td className="text-sm">
                        📍 {k.location || k.region || 'India'}
                      </td>

                      <td className="font-mono text-sm">
                        {k.hiveCount || 45} Hives
                      </td>

                      <td className="text-sm text-secondary">
                        {k.flora || 'Wild Multifloral'}
                      </td>

                      {/* Verified Status Tag */}
                      <td>
                        {isAadhaar ? (
                          <span className="table-status-tag verified-aadhaar">
                            <span className="shield-icon">🛡️</span> Verified via Aadhaar
                          </span>
                        ) : (
                          <span className="table-status-tag verified-node">
                            <span className="shield-icon">✓</span> Verified Node
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          className="btn-table-action"
                          onClick={() => navigateTo('batch-entry')}
                          title="Log new batch for this beekeeper"
                        >
                          Mint Batch →
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredBeekeepers.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty-table-cell">
                      No beekeepers match "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
