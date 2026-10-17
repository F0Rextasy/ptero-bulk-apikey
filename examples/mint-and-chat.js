'use strict';

/**
 * Smallest useful thing: mint a few identities, verify them with a real chat call, then
 * serve them from a pool with failover.
 *
 *   node examples/mint-and-chat.js [count]
 */

const os = require('os');
const path = require('path');
const { Ptero } = require('../src/lib/ptero.js');
const { mintIdentities, VerifiedPool } = require('../src/lib/pool.js');

(async () => {
  const count = Number(process.argv[2] || 3);

  // 1. one identity, straight upstream — no pool, no shim.
  const single = new Ptero();
  const one = await single.chat('Reply with the single word: ok', { model: 'deepseek-v4.1-flash:free' });
  console.log(`single identity ${single.token.slice(0, 8)}… → ${JSON.stringify(one.text.trim())} (served ${one.meta.model_used})`);

  // 2. a verified pool. Written to a temp file so the repo stays clean.
  const poolFile = path.join(os.tmpdir(), 'ptero-example-pool.txt');
  const r = await mintIdentities({ count, conc: Math.min(count, 3), outFile: poolFile, log: console.log });
  console.log(`minted ${r.verified.length}/${count} in ${r.seconds.toFixed(1)}s → ${r.fileSize} in pool`);

  // 3. chat through the pool with failover.
  const pool = new VerifiedPool(poolFile);
  const out = await pool.chat({ message: 'Reply with the single word: ok', model: 'deepseek-v4.1-flash:free' });
  console.log(`pool identity ${out.identity.slice(0, 8)}… → ${JSON.stringify(out.text.trim())} (served ${out.meta.model_used})`);
  console.log(`pool file: ${poolFile}`);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});