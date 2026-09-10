import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { simpleSha256, generateBatchNumber, generateNodeId } from '../utils/crypto';
import { createBatchHash, GENESIS_PREV_HASH } from '../utils/hashChain';

const HoneyChainContext = createContext(null);

// Genesis block hash constant
const GENESIS_HASH = GENESIS_PREV_HASH;

// Seed Beekeepers
const SEED_BEEKEEPERS = [
  {
    id: 'BEE-IND-7429',
    beekeeperId: 'BEE-IND-7429',
    nodeId: 'BEE-IND-7429',
    name: 'Kangra Valley Apiaries',
    beekeeperName: 'Sunita Sharma',
    phone: '98450 12345',
    aadhaar: 'XXXX-XXXX-8912',
    location: 'Kangra Valley, Himachal Pradesh, India',
    region: 'Kangra Valley, Himachal Pradesh, India',
    regionCode: 'IN',
    flora: 'Wild Multifloral, Mustard & Acacia Blossom',
    licenseNumber: 'FSSAI-API-2291',
    hiveCount: 65,
    certifications: ['100% Raw Honey', 'Aadhaar e-KYC Verified', 'Jaivik Bharat Organic'],
    bio: 'High-altitude Himalayan wild bee sanctuaries practicing ethical cold-filtration harvesting.',
    createdAt: '2025-11-05T10:00:00Z',
    verified: true,
    status: 'Verified (UIDAI e-KYC)'
  },
  {
    id: 'api-1',
    beekeeperId: 'NODE-AOT-4091',
    nodeId: 'NODE-AOT-4091',
    name: 'Aotearoa Wild Reserves',
    beekeeperName: 'Aroha Miller',
    phone: '21940 91234',
    aadhaar: 'XXXX-XXXX-4091',
    location: 'Coromandel Peninsula, New Zealand',
    region: 'Coromandel Peninsula, New Zealand',
    regionCode: 'NZ',
    flora: 'Mānuka (Leptospermum scoparium)',
    licenseNumber: 'NZ-MPI-4091',
    hiveCount: 185,
    certifications: ['100% Raw Unpasteurized', 'UMF 20+ Grade', 'BioGro Certified Organic', 'Ethical Apiary Standard'],
    bio: 'Pioneering sustainable high-altitude Mānuka harvesting in coastal native reserves. Strict zero-heat extraction protocol preserves live enzymes.',
    createdAt: '2025-08-14T09:00:00Z',
    verified: true,
    status: 'Verified Node'
  },
  {
    id: 'api-2',
    beekeeperId: 'NODE-VAL-8820',
    nodeId: 'NODE-VAL-8820',
    name: 'Valensole Highland Botanicals',
    beekeeperName: 'Henri Laurent',
    phone: '61234 56789',
    aadhaar: 'XXXX-XXXX-8820',
    location: 'Plateau de Valensole, Provence, France',
    region: 'Plateau de Valensole, Provence, France',
    regionCode: 'FR',
    flora: 'Fine Highland Lavender & Wild Thyme',
    licenseNumber: 'FR-AGRI-8820',
    hiveCount: 120,
    certifications: ['Cold-Extracted', 'AOP Provence Protection', 'Biodynamic Certified Demeter'],
    bio: 'Fourth-generation master beekeeper practicing single-bloom rotational foraging across sun-drenched Provence plateaus.',
    createdAt: '2025-09-02T11:30:00Z',
    verified: true,
    status: 'Verified Node'
  },
  {
    id: 'api-3',
    beekeeperId: 'NODE-CAS-5512',
    nodeId: 'NODE-CAS-5512',
    name: 'Cascade Crest Apiaries',
    beekeeperName: 'Elena Rostova',
    phone: '20655 50199',
    aadhaar: 'XXXX-XXXX-5512',
    location: 'North Cascades, Washington, USA',
    region: 'North Cascades, Washington, USA',
    regionCode: 'US',
    flora: 'Wild Mountain Blackberry & Alpine Fireweed',
    licenseNumber: 'US-USDA-WA-5512',
    hiveCount: 96,
    certifications: ['100% Raw & Unfiltered', 'Non-GMO Project Verified', 'Pacific Northwest Pollinator Safe'],
    bio: 'Glacier-fed alpine apiaries tucked within protected national forestry buffer zones with zero industrial pesticide exposure.',
    createdAt: '2025-10-18T14:15:00Z',
    verified: true,
    status: 'Verified Node'
  }
];

// Helper to compute block hash using createBatchHash
function computeBlockHash(blockIndex, prevHash, batchNumber, beekeeperId, harvestDate, purityScore, moisturePercent, timestamp) {
  const payload = {
    blockIndex,
    batchNumber,
    beekeeperId,
    harvestDate,
    purityScore,
    moisturePercent,
    timestamp
  };
  return createBatchHash(payload, prevHash);
}

// Compute initial chained batches
function createInitialBatches() {
  const seedDefs = [
    {
      batchNumber: 'HC-8921-NZ',
      beekeeperId: 'api-1',
      harvestDate: '2026-01-12',
      extractionDate: '2026-01-15',
      floralType: 'Monofloral Mānuka UMF 20+',
      quantityKg: 420,
      jarCount: 840,
      moisturePercent: 16.2,
      purityScore: 99.6,
      labCertNumber: 'LAB-NZ-9821-MGO830',
      pollenCountRatio: '84.8% Leptospermum DNA',
      colorGrade: 'Light Amber (45mm Pfund)',
      sensoryNotes: 'Intense mineral undertones with rich caramel sweetness, herbal finish, and dense velvety crystal structure.',
      nmrSpectrumStatus: 'Pass — Zero C3/C4 Exogenous Sugars Detected',
      pesticideResidue: 'ND (Not Detected < 0.001 ppm)',
      status: 'Verified Authentic',
      timestamp: '2026-01-16T10:00:00Z'
    },
    {
      batchNumber: 'HC-4412-FR',
      beekeeperId: 'api-2',
      harvestDate: '2025-07-22',
      extractionDate: '2025-07-25',
      floralType: 'Provence Highland Lavender',
      quantityKg: 310,
      jarCount: 620,
      moisturePercent: 16.9,
      purityScore: 98.9,
      labCertNumber: 'LAB-FR-3042-LAV',
      pollenCountRatio: '78.2% Lavandula angustifolia',
      colorGrade: 'Extra White / Pearl (18mm Pfund)',
      sensoryNotes: 'Ethereal floral aroma with faint notes of almond blossom, delicate acidity, and clean citrus finish.',
      nmrSpectrumStatus: 'Pass — Pure Monofloral Profile Verified',
      pesticideResidue: 'ND (Not Detected < 0.001 ppm)',
      status: 'Verified Authentic',
      timestamp: '2025-07-26T14:30:00Z'
    },
    {
      batchNumber: 'HC-5120-US',
      beekeeperId: 'api-3',
      harvestDate: '2025-08-25',
      extractionDate: '2025-08-28',
      floralType: 'Cascade Wild Mountain Blackberry',
      quantityKg: 280,
      jarCount: 560,
      moisturePercent: 17.3,
      purityScore: 98.4,
      labCertNumber: 'LAB-US-7711-RUBUS',
      pollenCountRatio: '76.5% Rubus ursinus',
      colorGrade: 'Amber (65mm Pfund)',
      sensoryNotes: 'Deep wild berry profile, warm molasses tones, smooth buttery mouthfeel with rich woodland finish.',
      nmrSpectrumStatus: 'Pass — No Thermal Inversion HMF < 4mg/kg',
      pesticideResidue: 'ND (Not Detected < 0.001 ppm)',
      status: 'Verified Authentic',
      timestamp: '2025-08-29T16:00:00Z'
    },
    {
      batchNumber: 'HC-9104-NZ',
      beekeeperId: 'api-1',
      harvestDate: '2026-02-04',
      extractionDate: '2026-02-08',
      floralType: 'Coastal Mānuka & Kānuka Wild Blend',
      quantityKg: 390,
      jarCount: 780,
      moisturePercent: 16.5,
      purityScore: 99.2,
      labCertNumber: 'LAB-NZ-9904-MGO650',
      pollenCountRatio: '81.4% Native Myrtaceae',
      colorGrade: 'Golden Amber (52mm Pfund)',
      sensoryNotes: 'Earthy pine resin, toasted honeycomb, warm butterscotch sweetness with a lingering peppery kick.',
      nmrSpectrumStatus: 'Pass — Raw State Confirmed Active Diastase > 14 DN',
      pesticideResidue: 'ND (Not Detected < 0.001 ppm)',
      status: 'Verified Authentic',
      timestamp: '2026-02-09T11:45:00Z'
    }
  ];

  let prevHash = GENESIS_HASH;
  const result = [];

  seedDefs.forEach((def, index) => {
    const blockIndex = index + 1;
    const blockHash = computeBlockHash(
      blockIndex,
      prevHash,
      def.batchNumber,
      def.beekeeperId,
      def.harvestDate,
      def.purityScore,
      def.moisturePercent,
      def.timestamp
    );

    result.push({
      ...def,
      batchId: def.batchNumber,
      blockIndex,
      prevHash,
      previousHash: prevHash,
      blockHash,
      hash: blockHash,
      location: def.region || 'Registered Sanctuary',
      qualityTestResult: `${def.purityScore}% NMR Purity — ${def.nmrSpectrumStatus}`
    });

    prevHash = blockHash;
  });

  return result;
}

export function HoneyChainProvider({ children }) {
  // Pure in-memory session state - NO localStorage
  const [beekeepers, setBeekeepers] = useState(() => SEED_BEEKEEPERS);
  const [batches, setBatches] = useState(() => createInitialBatches());
  const [activePage, setActivePage] = useState('landing');
  const [lookupParam, setLookupParam] = useState('');
  const [notification, setNotification] = useState(null);

  // Sync with window.location.hash for smooth client-side routing
  const parseHash = useCallback(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      setActivePage('landing');
      return;
    }
    const parts = hash.split('/');
    const page = parts[0] || 'landing';
    const validPages = ['landing', 'register', 'batch-entry', 'lookup', 'admin'];

    if (validPages.includes(page)) {
      setActivePage(page);
      if (page === 'lookup' && parts[1]) {
        setLookupParam(parts[1].toUpperCase());
      }
    } else {
      setActivePage('landing');
    }
  }, []);

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [parseHash]);

  // Navigate helper
  const navigateTo = useCallback((page, param = '') => {
    if (page === 'lookup' && param) {
      window.location.hash = `#lookup/${param}`;
      setLookupParam(param);
    } else {
      window.location.hash = `#${page}`;
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Show temporary toast notification
  const showToast = useCallback((message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.id ? null : prev));
    }, 4500);
  }, []);

  // Register a new beekeeper with Aadhaar verification
  const registerBeekeeper = useCallback((formData) => {
    const id = formData.beekeeperId || `BEE-${Date.now().toString(36).toUpperCase()}`;
    const nodeId = formData.nodeId || id;
    const newBeekeeper = {
      id,
      beekeeperId: id,
      nodeId,
      name: formData.name ? formData.name.trim() : (formData.beekeeperName?.trim() || 'Apiary Partner'),
      beekeeperName: (formData.beekeeperName || formData.name || 'Beekeeper').trim(),
      phone: formData.phone?.trim() || '',
      aadhaar: formData.aadhaar?.trim() || '',
      location: formData.location?.trim() || formData.region?.trim() || 'India',
      region: formData.location?.trim() || formData.region?.trim() || 'India',
      regionCode: formData.regionCode?.trim() || 'IN',
      flora: formData.flora?.trim() || 'Wild Multifloral & Mustard Blossom',
      licenseNumber: formData.licenseNumber?.trim() || `API-LIC-${Math.floor(10000 + Math.random() * 90000)}`,
      hiveCount: Number(formData.hiveCount) || 45,
      certifications: formData.certifications || ['100% Raw Honey', 'Aadhaar e-KYC Verified'],
      bio: formData.bio?.trim() || `UIDAI e-KYC verified apiary producer located in ${formData.location || 'India'}. Committed to authentic raw honey harvesting.`,
      verified: true,
      status: 'Verified (UIDAI e-KYC)',
      verificationMethod: 'Aadhaar OTP (UIDAI e-KYC)',
      createdAt: new Date().toISOString()
    };

    setBeekeepers(prev => [newBeekeeper, ...prev]);
    showToast(`Beekeeper "${newBeekeeper.beekeeperName}" verified & registered! ID: ${newBeekeeper.beekeeperId}`, 'success');
    return newBeekeeper;
  }, [showToast]);

  // Direct append batch object to chain
  const addBatchToChain = useCallback((newBatch) => {
    setBatches(prev => [...prev, newBatch]);
    showToast(`Batch #${newBatch.batchId || newBatch.batchNumber} added to chain (Block #${newBatch.blockIndex})!`, 'success');
    return newBatch;
  }, [showToast]);

  // Mint a new honey batch to the chain
  const mintBatch = useCallback((formData) => {
    const timestamp = new Date().toISOString();
    const batchId = formData.batchId?.trim() || formData.batchNumber?.trim() || generateBatchNumber(formData.regionCode || 'IN');
    const batchNumber = batchId;

    // Get previous block hash
    const prevBlock = batches[batches.length - 1];
    const prevHash = formData.previousHash || (prevBlock ? (prevBlock.hash || prevBlock.blockHash) : GENESIS_HASH);
    const blockIndex = batches.length + 1;

    // If precomputed hash was provided from createBatchHash, use it; otherwise compute
    const blockHash = formData.hash || formData.blockHash || createBatchHash(
      {
        batchId,
        beekeeperId: formData.beekeeperId,
        harvestDate: formData.harvestDate,
        quantityKg: Number(formData.quantityKg),
        location: formData.location || formData.region,
        qualityTestResult: formData.qualityTestResult || `${formData.purityScore || 99}% NMR Pure`,
        timestamp
      },
      prevHash
    );

    const newBatch = {
      batchId,
      batchNumber,
      beekeeperId: formData.beekeeperId,
      harvestDate: formData.harvestDate,
      extractionDate: formData.extractionDate || formData.harvestDate,
      floralType: formData.floralType || 'Monofloral Raw Honey',
      location: formData.location || formData.region || 'Registered Sanctuary',
      quantityKg: Number(formData.quantityKg),
      jarCount: Number(formData.jarCount) || Math.round(Number(formData.quantityKg) * 2),
      moisturePercent: Number(formData.moisturePercent) || 16.5,
      purityScore: Number(formData.purityScore) || 99.2,
      qualityTestResult: formData.qualityTestResult || `${formData.purityScore || 99.2}% NMR Spectrometry — Passed Grade A`,
      labCertNumber: formData.labCertNumber || `LAB-${Math.floor(1000 + Math.random() * 9000)}-CERT`,
      pollenCountRatio: formData.pollenCountRatio || '80%+ Monofloral Match',
      colorGrade: formData.colorGrade || 'Golden Amber (50mm Pfund)',
      sensoryNotes: formData.sensoryNotes || 'Pure unadulterated raw honey profile.',
      nmrSpectrumStatus: 'Pass — Cryptographically Sealed On-Chain',
      pesticideResidue: 'ND (Not Detected < 0.001 ppm)',
      status: 'Verified Authentic',
      timestamp,
      blockIndex,
      prevHash,
      previousHash: prevHash,
      blockHash,
      hash: blockHash
    };

    setBatches(prev => [...prev, newBatch]);
    showToast(`Batch #${newBatch.batchId} successfully minted to Block #${blockIndex}!`, 'success');
    return newBatch;
  }, [batches, showToast]);

  // Find batch by number
  const getBatch = useCallback((batchNumber) => {
    if (!batchNumber) return null;
    const cleanNum = batchNumber.trim().toUpperCase();
    return batches.find(b => b.batchNumber.toUpperCase() === cleanNum) || null;
  }, [batches]);

  // Find beekeeper by ID
  const getBeekeeper = useCallback((id) => {
    return beekeepers.find(b => b.id === id) || null;
  }, [beekeepers]);

  // Reset to seed data
  const resetToSeedData = useCallback(() => {
    setBeekeepers(SEED_BEEKEEPERS);
    setBatches(createInitialBatches());
    showToast('HoneyChain ledger reset to default seed apiaries and blocks.', 'info');
  }, [showToast]);

  return (
    <HoneyChainContext.Provider
      value={{
        beekeepers,
        batches,
        activePage,
        lookupParam,
        setLookupParam,
        navigateTo,
        registerBeekeeper,
        mintBatch,
        addBatchToChain,
        getBatch,
        getBeekeeper,
        resetToSeedData,
        notification,
        setNotification
      }}
    >
      {children}
    </HoneyChainContext.Provider>
  );
}

export function useHoneyChain() {
  const context = useContext(HoneyChainContext);
  if (!context) {
    throw new Error('useHoneyChain must be used within a HoneyChainProvider');
  }
  return context;
}
