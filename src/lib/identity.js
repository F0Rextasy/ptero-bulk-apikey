'use strict';

/**
 * ptero.pro identities.
 *
 * There is no signup. An identity is a random 32-hex token that the client invents and sends
 * as `X-MLP-Guest-Token`; ptero never asks who you are, there is no e-mail, no password and
 * no captcha. Minting is therefore instant and offline — the only cost of an identity is the
 * chat call that proves it works.
 */

const crypto = require('crypto');

/** A ptero guest token is exactly 32 lowercase hex characters. */
const isGuestToken = (t) => typeof t === 'string' && /^[0-9a-f]{32}$/i.test(t);

/** Mint a fresh identity. Offline, ~microseconds. */
function newIdentity() {
  return crypto.randomUUID().replace(/-/g, '');
}

const FIRST = [
  'Alex', 'Jordan', 'Sky', 'Milo', 'Nova', 'Riley', 'Casey', 'Kai', 'Luna', 'Theo',
  'Ivy', 'Mason', 'Zara', 'Leo', 'Ava', 'Finn', 'Maya', 'Noah', 'Ruby', 'Ezra',
];
const LAST = [
  'Reed', 'Stone', 'Vale', 'Brooks', 'Hart', 'Wells', 'Kings', 'Lane', 'Cross', 'Frost',
  'Parker', 'Hale', 'Marsh', 'Quinn', 'Rowe', 'Blake', 'Dane', 'Fenn', 'Grove', 'Sawyer',
];

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

/** ptero also wants a display name; any name works. */
function newUsername() {
  return `${pick(FIRST)} ${pick(LAST)}`;
}

/**
 * Round-robin identity pool with per-identity cooldown.
 *
 * Cooldown matters because an identity that just failed should not be retried immediately —
 * the ptero client fails over to the next identity and marks the bad one for 60 s.
 */
class IdentityPool {
  /** @param {string[]} identities one 32-hex token per member */
  constructor(identities = []) {
    this.members = identities.filter(isGuestToken);
    this.cursor = 0;
    this.cooldown = new Map(); // identity -> epoch ms
  }

  get size() {
    return this.members.length;
  }

  /** Reload from a newline-separated file, dropping anything that is not a token. */
  loadFile(file) {
    const fs = require('fs');
    if (!file || !fs.existsSync(file)) return this;
    this.members = fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim().split(/[\s,]+/)[0])
      .filter(isGuestToken);
    return this;
  }

  /** Next healthy identity, or `null` when every member is cooling down. */
  next() {
    const now = Date.now();
    for (let i = 0; i < this.members.length; i++) {
      const id = this.members[(this.cursor + i) % this.members.length];
      if ((this.cooldown.get(id) || 0) < now) {
        this.cursor = (this.cursor + i + 1) % this.members.length;
        return id;
      }
    }
    return null;
  }

  /**
   * Every healthy identity in rotation order, starting at the cursor, advancing it by one.
   * Used to build a failover list without walking the cursor a full lap.
   */
  snapshot() {
    if (!this.members.length) return [];
    const now = Date.now();
    const healthy = [];
    for (let i = 0; i < this.members.length; i++) {
      const id = this.members[(this.cursor + i) % this.members.length];
      if ((this.cooldown.get(id) || 0) < now) healthy.push(id);
    }
    this.cursor = (this.cursor + 1) % this.members.length;
    return healthy;
  }

  /** Park an identity for `ms` (default 60 s) after an error. */
  cool(identity, ms = 60_000) {
    if (identity) this.cooldown.set(identity, Date.now() + ms);
  }

  clearCooldown(identity) {
    this.cooldown.delete(identity);
  }

  get cooling() {
    const now = Date.now();
    return [...this.cooldown.entries()].filter(([, until]) => until > now).length;
  }
}

module.exports = { newIdentity, newUsername, isGuestToken, IdentityPool };