'use strict';

/**
 * ptero.pro client.
 *
 * Base is the site's WordPress REST namespace; chat is a POST to `/chat-stream` that answers
 * `text/event-stream`. The only non-obvious part is the nonce: every request needs an
 * `X-WP-Nonce` header, it is *not* an API key, and a hardcoded value stops working.
 *
 *   GET https://ptero.pro/                     → HTML containing  var nonce = "<10 hex>"
 *   POST /wp-json/mlp/v1/chat-stream           → 200 text/event-stream
 *        headers: X-WP-Nonce, X-MLP-Guest-Token, X-MLP-Guest-Username, Origin/Referer
 *        body:    {message, model, conversation_id, attachments, history, lang, mode}
 *        events:  phase · activity · progress · thinking · token · done
 *        done:    {model_used, usage_tokens, conversation_id}
 *
 * The nonce is guest-wide (every identity shares it), every response echoes a fresh one in
 * the `x-wp-nonce` header — which we adopt — and a `403 rest_cookie_invalid_nonce` means it
 * rotated, so we re-scrape and retry once.
 *
 * Other endpoints: `/status` (catalogue health + default model), `/usage` (this identity's
 * token bucket), `/api-keys` (the guest's own key list — empty for a fresh identity).
 */

const crypto = require('crypto');
const { sharedExits } = require('./exits.js');
const { DEFAULT_MODEL } = require('./models.js');
const { newIdentity, newUsername, isGuestToken } = require('./identity.js');
// Node >=22's global fetch bundles its own undici and rejects a v6 `ProxyAgent`
// ("invalid onRequestStart method"), so prefer the installed undici's fetch when present.
let doFetch = globalThis.fetch;
try {
  const undici = require('undici');
  if (typeof undici.fetch === 'function') doFetch = undici.fetch;
} catch {}

const BASE = process.env.PTERO_BASE || 'https://ptero.pro/wp-json/mlp/v1';
const HOME = process.env.PTERO_HOME || 'https://ptero.pro/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/131.0.0.0 Safari/537.36';

/** The scraped nonce is cached process-wide: it is guest-wide, so one scrape serves all. */
let cachedNonce = null;
let nonceAt = 0;
const NONONCE_TTL_MS = 30 * 60_000;

/**
 * Scrape the WordPress nonce from the homepage.
 * @param {boolean} [force] ignore the cache (used after a 403)
 */
async function fetchNonce(force = false, exits) {
  if (!force && cachedNonce && Date.now() - nonceAt < NONONCE_TTL_MS) return cachedNonce;
  let exit = null;
  if (exits) { try { exit = await exits.acquire(); } catch {} }
  // The homepage is Cloudflare-cached with the nonce baked in; a stale one 403s
  // ("Cookie check failed"), so bust the cache on every scrape.
  const url = HOME + (HOME.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  const res = await doFetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html', 'Cache-Control': 'no-cache' }, dispatcher: exit && exit.dispatcher });
  const html = await res.text();
  const m = html.match(/var\s+nonce\s*=\s*"([0-9a-z]{6,16})"/i);
  if (!m) throw new Error('ptero nonce not found in the homepage HTML');
  cachedNonce = m[1];
  nonceAt = Date.now();
  return cachedNonce;
}

function rememberNonce(value) {
  if (!value) return;
  cachedNonce = value;
  nonceAt = Date.now();
}

/** One guest identity + one chat stream. */
class Ptero {
  /**
   * @param {{token?: string, username?: string, nonce?: string, exits?: object}} [opts]
   *   An invalid `token` is replaced with a freshly minted identity rather than rejected —
   *   there is no such thing as an invalid ptero identity, only a malformed string.
   */
  constructor({ token, username, nonce, exits } = {}) {
    this.token = isGuestToken(token) ? token : newIdentity();
    this.username = username || newUsername();
    this.nonce = nonce || '';
    this.exits = exits || sharedExits();
  }

  headers(extra) {
    return {
      'Content-Type': 'application/json',
      'X-WP-Nonce': this.nonce || cachedNonce || '',
      'X-MLP-Guest-Token': this.token,
      'X-MLP-Guest-Username': this.username,
      Accept: 'application/json, text/event-stream',
      Origin: HOME.replace(/\/$/, ''),
      Referer: HOME,
      'User-Agent': UA,
      ...(extra || {}),
    };
  }

  /**
   * One API call on a reserved exit, with failover.
   * A 429 penalises only that exit and the call moves on; a 403 re-scrapes the nonce once.
   */
  async request(path, opts = {}) {
    if (!this.nonce) this.nonce = await fetchNonce(false, this.exits);
    const { _retried, ...rest } = opts;
    const attempts = Math.max(2, this.exits.list.filter((e) => e.usable).length * 2);
    let lastStatus = 0;
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const exit = await this.exits.acquire();
      try {
        const res = await doFetch(BASE + path, {
          ...rest,
          headers: this.headers(rest.headers),
          dispatcher: exit && exit.dispatcher,
        });
        rememberNonce(res.headers.get('x-wp-nonce'));

        if (res.status === 429) {
          // "Too many messages" belongs to this egress IP, not to this identity.
          this.exits.penalize(exit, 20_000);
          lastStatus = 429;
          try { await res.arrayBuffer(); } catch { /* body already discarded */ }
          continue;
        }
        if (res.status === 403 && !_retried) {
          this.nonce = await fetchNonce(true, this.exits);
          return this.request(path, { ...opts, _retried: true });
        }
        return res;
      } catch (e) {
        this.exits.penalize(exit, 8_000);
        lastError = e;
      }
    }
    if (lastStatus) {
      const err = new Error('ptero: every egress exit is throttled (429) — add an exit or raise PTERO_EXIT_GAP');
      err.status = 429;
      throw err;
    }
    throw lastError || new Error('ptero: every egress exit failed');
  }

  async json(path, opts) {
    const res = await this.request(path, opts);
    if (!res.ok) throw await httpError(res);
    return res.json();
  }

  /** Site health: `disabled`, `disabled_models`, `cooldown_models`, `default_model`. */
  status() { return this.json('/status'); }

  /** This identity's token bucket: `{used, max, remaining, reset_seconds, …}`. */
  usage() { return this.json('/usage'); }

  /** The guest's own key list (empty on a fresh identity — ptero hands out no keys). */
  apiKeys() { return this.json('/api-keys'); }

  /**
   * POST /chat-stream and yield the parsed SSE events.
   * @returns {AsyncGenerator<object>}
   */
  async *stream(message, { model, conversationId, history, lang, mode, signal } = {}) {
    const body = {
      message,
      model: model || DEFAULT_MODEL,
      conversation_id: conversationId || crypto.randomUUID(),
      attachments: [],
      history: history || [],
      lang: lang || 'en',
      mode: mode || 'chat',
    };
    const res = await this.request('/chat-stream', {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) throw await httpError(res);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const frame = line.trim();
        if (!frame.startsWith('data:')) continue;
        const payload = frame.slice(5).trim();
        if (!payload) continue;
        try { yield JSON.parse(payload); } catch { /* keep-alive comment or partial frame */ }
      }
    }
  }

  /** Non-streaming convenience: the full text plus the `done` event's metadata. */
  async chat(message, opts) {
    let text = '';
    let meta = {};
    for await (const ev of this.stream(message, opts)) {
      if (typeof ev.token === 'string') text += ev.token;
      if (ev.done) meta = ev;
    }
    return { text, meta };
  }
}

/** Turn a non-2xx response into an Error that carries ptero's own message. */
async function httpError(res) {
  let message = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    if (body && body.message) message = body.message;
  } catch { /* not JSON */ }
  const err = new Error(message);
  err.status = res.status;
  return err;
}

module.exports = { Ptero, fetchNonce, BASE, HOME, UA };