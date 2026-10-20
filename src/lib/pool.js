'use strict';

/**
 * Verified-identity pool with failover.
 *
 * `mintIdentities()` writes only identities that answered a real chat request, so every
 * member of this pool has a measured 200 behind it. The pool then serves chat calls: pick a
 * member, run it, and on error cool it for 60 s and try the next.
 */

const fs = require('fs');
const path = require('path');
const { Ptero } = require('./ptero.js');
const { IdentityPool } = require('./identity.js');
const { resolveModel } = require('./models.js');

const DEFAULT_POOL_FILE = 'identities.txt';
const VERIFY_PROMPT = 'Reply with the single word: ok';

/**
 * Mint `--count` identities, prove each one with a real chat call, and append the
 * successes to `outFile`.
 *
 * The requests are paced by the shared exit scheduler, so `--conc` only decides how many
 * verifications are *in flight*, never how fast they hit one IP.
 *
 * @returns {Promise<{verified: object[], failed: object[], seconds: number, total: number}>}
 */
async function mintIdentities({
  count = 10,
  conc = 5,
  outFile = DEFAULT_POOL_FILE,
  model = resolveModel(null),
  verify = VERIFY_PROMPT,
  exits,
  log = () => {},
} = {}) {
  const targets = Array.from({ length: count }, () => new Ptero({ exits }));
  const started = Date.now();
  const results = new Array(count);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(conc, count) }, async () => {
      for (;;) {
        const i = cursor++;
        if (i >= count) return;
        const client = targets[i];
        const t0 = Date.now();
        try {
          const { meta, text } = await client.chat(verify, { model });
          results[i] = {
            ok: Boolean(meta.done && meta.model_used),
            identity: client.token,
            ms: Date.now() - t0,
            model_requested: model,
            model_served: meta.model_used,
            tokens: meta.usage_tokens,
            sample: (text || '').slice(0, 40),
          };
        } catch (e) {
          results[i] = { ok: false, identity: client.token, ms: Date.now() - t0, error: e.message, status: e.status };
        }
        const r = results[i];
        log(`  ${r.ok ? 'OK  ' : 'FAIL'} ${r.identity.slice(0, 8)}… ${r.ms}ms ${r.ok ? r.model_served : r.error || ''}`);
      }
    })
  );

  const verified = results.filter((r) => r && r.ok);
  const failed = results.filter((r) => r && !r.ok);
  if (verified.length) writePool(outFile, verified.map((r) => r.identity));

  return {
    verified,
    failed,
    seconds: (Date.now() - started) / 1000,
    total: results.length,
    file: outFile,
    fileSize: readPool(outFile).length,
  };
}

/** Read a pool file: one identity per line, anything that is not a token is dropped. */
function readPool(file = DEFAULT_POOL_FILE) {
  return new IdentityPool().loadFile(file).members;
}

/** Merge new identities into the pool file, keeping it de-duplicated and LF-terminated. */
function writePool(file, identities) {
  fs.mkdirSync(path.dirname(path.resolve(file)) || '.', { recursive: true });
  const merged = [...new Set([...readPool(file), ...identities])];
  fs.writeFileSync(file, merged.join('\n') + '\n');
  return merged.length;
}

/**
 * A pool that answers chat calls with failover.
 *
 * `Authorization: Bearer <32-hex>` selects that exact identity — which is what makes 9Router's
 * one-connection-per-key model meaningful. With no bearer, the pool round-robins.
 */
class VerifiedPool {
  constructor(file = DEFAULT_POOL_FILE, exits) {
    this.file = file;
    this.exits = exits;
    this.identities = new IdentityPool(readPool(file));
  }

  get size() { return this.identities.size; }
  get cooling() { return this.identities.cooling; }

  reload() {
    this.identities.loadFile(this.file);
    return this.size;
  }

  /** Run one chat call, failing over across pool members and then to a throwaway identity. */
  async chat({ bearer, message, model, conversationId, history, onToken }) {
    // A bearer pins one identity. Otherwise the first candidate is the next one in rotation
    // and the rest follow in pool order, for failover — taken as a snapshot so building the
    // list does not walk the cursor a full lap back to the identity we started with.
    const candidates = /^[0-9a-f]{32}$/i.test(bearer || '') ? [bearer] : this.identities.snapshot();
    if (!candidates.length) candidates.push(null); // empty pool: mint a throwaway identity

    let lastError;
    for (const identity of candidates) {
      const client = new Ptero(identity ? { token: identity, exits: this.exits } : { exits: this.exits });
      try {
        let text = '';
        let meta = {};
        for await (const ev of client.stream(message, { model, conversationId, history })) {
          if (typeof ev.token === 'string') {
            text += ev.token;
            if (onToken) onToken(ev.token);
          }
          if (ev.done) meta = ev;
        }
        if (!meta.done) throw new Error('ptero stream ended without a done event');
        if (identity) this.identities.clearCooldown(identity);
        return { text, meta, identity: client.token };
      } catch (e) {
        lastError = e;
        if (identity) this.identities.cool(identity, 60_000);
      }
    }
    throw lastError || new Error('no ptero identity available');
  }
}

module.exports = { mintIdentities, readPool, writePool, VerifiedPool, DEFAULT_POOL_FILE, VERIFY_PROMPT };