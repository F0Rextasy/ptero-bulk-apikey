'use strict';

/**
 * Egress-exit pool for ptero.pro.
 *
 * ptero's `429 Too many messages — please slow down` is a *per egress IP* throttle, not a
 * per-identity quota (measured 2026-10-17: on one exit a 0 ms gap between chat calls gave
 * 0/6 OK, 1000 ms gave 2/6, 2500 ms gave 6/6; a brand-new token 429s instantly on a hot exit
 * while the same second the same model answers 200 over a second exit).
 *
 * So every exit is its own bucket: this module reserves an exit per request with a minimum
 * gap, turning the throttle into latency instead of failures, and skips an exit for 20 s when
 * it does answer 429.
 *
 * Exits are configured with `PTERO_EXITS=direct,http://host:port,…` (HTTP/SOCKS5 proxy
 * URLs) and the pacing with `PTERO_EXIT_GAP=<ms>`. Nothing is shipped preconfigured: the
 * default is a single direct exit, which works fine for a local shim and only starts to
 * throttle once you push sustained traffic.
 */

const DEFAULT_GAP_MS = 2600;

let roundRobin = 0;

/**
 * Build a `fetch` dispatcher for one exit.
 * @returns {undefined} direct connection · a `ProxyAgent` · `null` exit unusable (no undici)
 */
function makeDispatcher(url) {
  if (!url || url === 'direct') return undefined;
  let ProxyAgent;
  try {
    // Optional dependency: only proxied exits need it. Plain HTTP works without it.
    ({ ProxyAgent } = require('undici'));
  } catch (e) {
    console.warn(`[ptero] proxy exits need the optional 'undici' package (${e.message}); ${url} skipped`);
    return null;
  }
  return new ProxyAgent({ uri: url, connectTimeout: 10_000 });
}

function parseExits(list) {
  return list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url) => {
      const dispatcher = makeDispatcher(url);
      return {
        url,
        dispatcher: dispatcher === undefined ? undefined : dispatcher,
        usable: dispatcher !== null,
        until: 0, // penalised until this timestamp
        nextAt: 0, // reserved until this timestamp
      };
    });
}

/**
 * The configured exits plus the scheduler.
 *
 * @param {{exits?: string[], gapMs?: number, log?: (msg: string) => void}} [opts]
 */
function createExits({ exits, gapMs, log } = {}) {
  const list = parseExits(
    exits || process.env.PTERO_EXITS || 'direct'
  );
  const gap = Number(gapMs || process.env.PTERO_EXIT_GAP || DEFAULT_GAP_MS);
  const usable = list.filter((e) => e.usable);
  const say = log || (() => {});

  return {
    list,
    gapMs: gap,

    /** Roughly how many chat calls per minute this configuration can sustain. */
    capacityPerMinute() {
      return usable.length ? Math.round((usable.length * 60_000) / gap) : 0;
    },

    /**
     * Wait for a free exit and reserve it. Concurrent callers queue here instead of
     * tripping the IP-level 429.
     */
    async acquire() {
      for (;;) {
        const now = Date.now();
        for (let i = 0; i < usable.length; i++) {
          const e = usable[(roundRobin + i) % usable.length];
          const readyAt = Math.max(e.until, e.nextAt);
          if (readyAt <= now) {
            e.nextAt = now + gap;
            roundRobin = (roundRobin + i + 1) % usable.length;
            return e;
          }
        }
        if (!usable.length) throw new Error('no usable egress exit configured (PTERO_EXITS)');
        const wait = Math.min(...usable.map((e) => Math.max(e.until, e.nextAt) - now));
        say(`[ptero] every exit is busy — queueing ${wait}ms`);
        await new Promise((r) => setTimeout(r, Math.max(100, Math.min(wait, 1500))));
      }
    },

    /** Park one exit for `ms` (a 429 on that IP is the exit's fault, not the identity's). */
    penalize(exit, ms) {
      if (exit) exit.until = Math.max(exit.until, Date.now() + ms);
    },
  };
}

/** Process-wide default pool, so the CLI and the shim share one rotation. */
let shared = null;
function sharedExits() {
  if (!shared) shared = createExits();
  return shared;
}

module.exports = { createExits, sharedExits, makeDispatcher, DEFAULT_GAP_MS };