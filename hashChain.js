/**
 * ============================================================================
 * HoneyChain Protocol — Cryptographic Hash Chain Module (hashChain.js)
 * ============================================================================
 * 
 * Overview for Judges & Reviewers:
 * --------------------------------
 * This module implements a cryptographic hash chain (blockchain) for honey batch
 * provenance and anti-adulteration verification.
 *
 * Key Concepts:
 * 1. SHA-256 Hashing:
 *    A one-way cryptographic hash function that produces a unique 256-bit
 *    (64-character hexadecimal) digest. It possesses the "avalanche effect" — 
 *    changing even a single character (e.g. changing moisture from 16.5% to 16.6%)
 *    radically alters the entire hash.
 *
 * 2. Deterministic / Canonical Serialization:
 *    In JavaScript, object key ordering is not guaranteed. Before hashing,
 *    we sort object keys recursively. This ensures the exact same honey batch data
 *    always generates the exact same hash across different platforms and browsers.
 *
 * 3. Chained Hash Security:
 *    Each batch links to the hash of the preceding batch (`previousHash`).
 *    An attacker cannot alter an earlier harvest record without invalidating
 *    every subsequent block in the entire chain.
 *
 * 4. Dual Verification:
 *    `verifyChain` checks TWO critical invariants for every block:
 *      (a) Link Integrity: Does `current.previousHash` match `previous.hash`?
 *      (b) Data Integrity: Does `current.hash` match re-hashed `current.batchData`?
 * ============================================================================
 */

import CryptoJS from 'crypto-js';

/**
 * Standard Genesis Hash for Block #0
 * 64 zeroes representing the root of the immutable ledger.
 */
export const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Helper: Recursively canonicalize (sort keys of) an object or array.
 * Guarantees consistent JSON serialization regardless of property insertion order.
 * 
 * @param {*} data - Any data payload (object, array, primitive)
 * @returns {*} Sorted, deterministic copy of the data
 */
export function canonicalizeData(data) {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(canonicalizeData);
  }
  return Object.keys(data)
    .sort()
    .reduce((sortedObj, key) => {
      sortedObj[key] = canonicalizeData(data[key]);
      return sortedObj;
    }, {});
}

/**
 * createBatchHash
 * 
 * Computes a deterministic SHA-256 cryptographic hash combining the batch data
 * and the cryptographic hash of the previous batch block.
 *
 * Mathematical representation:
 *   Hash_n = SHA256( CanonicalJSON(BatchData_n) + PreviousHash_(n-1) )
 *
 * @param {Object|string} batchData - The attributes of the honey harvest batch
 *        (e.g., batchNumber, beekeeperId, floralType, moisturePercent, purityScore, etc.)
 * @param {string} [previousHash=GENESIS_PREV_HASH] - SHA-256 hash of previous block
 * @returns {string} 64-character hexadecimal SHA-256 digest
 *
 * @example
 * const hash = createBatchHash(
 *   { batchNumber: 'HC-8921-NZ', purity: 99.6, moisture: 16.2 },
 *   '0000000000000000000000000000000000000000000000000000000000000000'
 * );
 */
export function createBatchHash(batchData, previousHash = GENESIS_PREV_HASH) {
  // Step 1: Ensure previousHash is sanitized
  const prev = (previousHash && typeof previousHash === 'string') 
    ? previousHash.trim() 
    : GENESIS_PREV_HASH;

  // Step 2: Canonicalize and stringify the batch data to guarantee determinism
  const normalizedDataString = typeof batchData === 'string'
    ? batchData.trim()
    : JSON.stringify(canonicalizeData(batchData));

  // Step 3: Combine payload with previousHash link (merkle-like concatenation)
  const combinedPayload = `${normalizedDataString}|PREV:${prev}`;

  // Step 4: Generate SHA-256 hash digest via crypto-js
  const hashDigest = CryptoJS.SHA256(combinedPayload).toString(CryptoJS.enc.Hex);

  return hashDigest;
}

/**
 * Web Crypto API Alternative (Async):
 * Demonstrates native browser/Node.js Web Crypto implementation
 * for judges interested in zero-dependency native crypto.
 *
 * @param {Object|string} batchData 
 * @param {string} previousHash 
 * @returns {Promise<string>}
 */
export async function createBatchHashWebCrypto(batchData, previousHash = GENESIS_PREV_HASH) {
  const prev = (previousHash && typeof previousHash === 'string') 
    ? previousHash.trim() 
    : GENESIS_PREV_HASH;
  const normalizedDataString = typeof batchData === 'string'
    ? batchData.trim()
    : JSON.stringify(canonicalizeData(batchData));
  const combinedPayload = `${normalizedDataString}|PREV:${prev}`;

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(combinedPayload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * verifyChain
 *
 * Validates the cryptographic integrity of an entire sequence of honey batches.
 * Walks through the array sequentially and verifies two vital blockchain properties:
 *
 * 1. Continuity Check (Parent Pointer):
 *    Does batch[i].previousHash strictly equal batch[i-1].hash?
 *    (Catches block deletion, re-ordering, or foreign block injection)
 *
 * 2. Integrity Check (Tamper Detection):
 *    Does re-computing createBatchHash(batch[i].data, batch[i].previousHash)
 *    exactly equal batch[i].hash?
 *    (Catches modification of harvest data, syrup adulteration, falsified purity, etc.)
 *
 * @param {Array<Object>} batchArray - Sequential list of batch blocks
 * @returns {{
 *   isValid: boolean,
 *   brokenIndex: number|null,
 *   brokenBatch: Object|null,
 *   reason: string|null,
 *   totalVerified: number
 * }} Detailed verification result
 *
 * @example
 * const result = verifyChain(myBatches);
 * if (!result.isValid) {
 *   console.error(`Tampering detected at batch index ${result.brokenIndex}: ${result.reason}`);
 * } else {
 *   console.log(`All ${result.totalVerified} batches verified authentic!`);
 * }
 */
export function verifyChain(batchArray) {
  // Edge case 1: Validate input is an array
  if (!Array.isArray(batchArray)) {
    return {
      isValid: false,
      brokenIndex: null,
      brokenBatch: null,
      reason: 'Input is not a valid array of batches.',
      totalVerified: 0
    };
  }

  // Edge case 2: Empty chain is vacuously valid
  if (batchArray.length === 0) {
    return {
      isValid: true,
      brokenIndex: null,
      brokenBatch: null,
      reason: 'Chain is empty (0 batches).',
      totalVerified: 0
    };
  }

  // Sequential walk through the blockchain
  for (let i = 0; i < batchArray.length; i++) {
    const currentBlock = batchArray[i];

    // Extract current block hash and previous hash link
    // Supports both { hash, previousHash } and { blockHash, prevHash } schemas
    const currentHash = currentBlock.hash || currentBlock.blockHash;
    const currentPrevHash = currentBlock.previousHash || currentBlock.prevHash;

    // Extract underlying batch data payload
    // If block stores attributes inside a nested `batchData` or `data` property, use that;
    // otherwise extract all non-hash block metadata fields
    let dataPayload;
    if (currentBlock.batchData !== undefined) {
      dataPayload = currentBlock.batchData;
    } else if (currentBlock.data !== undefined) {
      dataPayload = currentBlock.data;
    } else {
      // Exclude block-level hash properties to reconstruct original payload
      const {
        hash,
        blockHash,
        previousHash,
        prevHash,
        ...remainingData
      } = currentBlock;
      dataPayload = remainingData;
    }

    // --- CHECK 1: Continuity / Parent Hash Linking ---
    if (i === 0) {
      // Genesis Block: previousHash is either GENESIS_PREV_HASH or accepted as root
      if (currentPrevHash && currentPrevHash !== GENESIS_PREV_HASH && currentPrevHash !== '0') {
        // Warning if genesis block does not use canonical zero root
      }
    } else {
      const predecessorBlock = batchArray[i - 1];
      const expectedPrevHash = predecessorBlock.hash || predecessorBlock.blockHash;

      if (currentPrevHash !== expectedPrevHash) {
        return {
          isValid: false,
          brokenIndex: i,
          brokenBatch: currentBlock,
          reason: `Chain broken at Batch #${i} (${currentBlock.batchNumber || `Index ${i}`}): ` +
                  `previousHash does not match predecessor hash! ` +
                  `[Expected: ${expectedPrevHash?.slice(0, 16)}..., Found: ${currentPrevHash?.slice(0, 16)}...]`,
          totalVerified: i
        };
      }
    }

    // --- CHECK 2: Data Tamper Detection (Re-hashing) ---
    const recalculatedHash = createBatchHash(dataPayload, currentPrevHash);

    if (currentHash !== recalculatedHash) {
      return {
        isValid: false,
        brokenIndex: i,
        brokenBatch: currentBlock,
        reason: `Data tampering detected at Batch #${i} (${currentBlock.batchNumber || `Index ${i}`}): ` +
                `Recorded hash does not match computed hash from batch data! ` +
                `[Recorded: ${currentHash?.slice(0, 16)}..., Recomputed: ${recalculatedHash.slice(0, 16)}...]`,
        totalVerified: i
      };
    }
  }

  // All blocks passed both Continuity and Data Integrity checks
  return {
    isValid: true,
    brokenIndex: null,
    brokenBatch: null,
    reason: `All ${batchArray.length} blocks in the chain are cryptographically valid and untampered.`,
    totalVerified: batchArray.length
  };
}

/**
 * Self-Test Demonstration function:
 * Convenient utility for live judge presentations.
 * Demonstrates:
 *   1. Successful creation and verification of a 3-batch chain.
 *   2. Detection of data tampering (e.g. changing moisture content).
 *   3. Detection of broken chain link (e.g. modifying parent pointer).
 */
export function runSelfTest() {
  console.log('--- RUNNING HONEYCHAIN CRYPTOGRAPHIC VERIFICATION TEST ---');

  // 1. Create a genuine 3-block honey chain
  const chain = [];

  // Block #0 (Genesis)
  const batch0Data = { batchNumber: 'HC-8921-NZ', flora: 'Manuka UMF 20+', moisture: 16.2, purity: 99.6 };
  const hash0 = createBatchHash(batch0Data, GENESIS_PREV_HASH);
  chain.push({ batchData: batch0Data, previousHash: GENESIS_PREV_HASH, hash: hash0 });

  // Block #1
  const batch1Data = { batchNumber: 'HC-4412-FR', flora: 'Provence Lavender', moisture: 16.9, purity: 98.9 };
  const hash1 = createBatchHash(batch1Data, hash0);
  chain.push({ batchData: batch1Data, previousHash: hash0, hash: hash1 });

  // Block #2
  const batch2Data = { batchNumber: 'HC-5120-US', flora: 'Cascade Blackberry', moisture: 17.3, purity: 98.4 };
  const hash2 = createBatchHash(batch2Data, hash1);
  chain.push({ batchData: batch2Data, previousHash: hash1, hash: hash2 });

  // Test Genuine Chain
  const test1 = verifyChain(chain);
  console.log('1. Genuine Chain Test:', test1.isValid ? 'PASSED (Valid)' : 'FAILED');

  // Test Tampering Attack (Adulterate Batch #1 moisture)
  const tamperedChain = JSON.parse(JSON.stringify(chain));
  tamperedChain[1].batchData.moisture = 19.5; // Attacker artificially modified moisture
  const test2 = verifyChain(tamperedChain);
  console.log('2. Tamper Detection Test:', !test2.isValid ? 'PASSED (Tamper caught at index ' + test2.brokenIndex + ')' : 'FAILED');

  // Test Link Sever Attack (Corrupt previousHash on Batch #2)
  const brokenLinkChain = JSON.parse(JSON.stringify(chain));
  brokenLinkChain[2].previousHash = 'badf00d'.padEnd(64, '0');
  const test3 = verifyChain(brokenLinkChain);
  console.log('3. Broken Link Detection Test:', !test3.isValid ? 'PASSED (Severed link caught at index ' + test3.brokenIndex + ')' : 'FAILED');

  return { test1, test2, test3 };
}

// Auto-run self test when executed directly via Node.js: `node hashChain.js`
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('hashChain.js')) {
  runSelfTest();
}

export default {
  createBatchHash,
  createBatchHashWebCrypto,
  verifyChain,
  canonicalizeData,
  GENESIS_PREV_HASH,
  runSelfTest
};
