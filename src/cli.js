#!/usr/bin/env node
'use strict';

/**
 * ptero-bulk — bulk ptero.pro identities, an OpenAI shim over them, and a 9Router connector.
 *
 *   ptero-bulk mint    --count 250 --conc 16        mint + verify identities into a pool file
 *   ptero-bulk shim    --port 8791 --pool …         serve the pool as OpenAI /v1
 *   ptero-bulk connect --n 16                       register the pool into a running 9Router
 *   ptero-bulk probe   --n 5 --gap 3000             end-to-end calls through 9Router
 *   ptero-bulk status                                upstream /status + this pool's /usage
 *   ptero-bulk limit   --k 12 --gap 2700            one identity, many calls: where the limit is
 *
 * ptero.pro has no signup. An identity is a random 32-hex token sent as `X-MLP-Guest-Token`,
 * so `mint` is instant — the cost is the chat call that verifies it.
 */

const fs = require('fs');
const { showBanner } = require('./launcher.js');
const { startShim } = require('./shim.js');
const { mintIdentities, readPool } = require('./lib/pool.js');
const { createExits } = require('./lib/exits.js');
const { MODELS, resolveModel } = require('./lib/models.js');
const { Ptero } = require('./lib/ptero.js');
const { newIdentity } = require('./lib/identity.js');
const router = require('./connect-9router.js');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const key = (eq >= 0 ? a.slice(2, eq) : a.slice(2)).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const inline = eq >= 0 ? a.slice(eq + 1) : undefined;
      if (inline !== undefined) args[key] = inline;
      else {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) args[key] = true;
        else { args[key] = next; i++; }
      }
    } else args._.push(a);
  }
  return args;
}

const HELP = `
${'ptero-bulk'} — bulk ptero.pro identities · OpenAI shim · 9Router connector

Usage
  ptero-bulk <command> [options]

Commands
  mint      Mint identities, verify each with a real chat call, append the winners to the pool
  shim      Serve the pool over OpenAI-compatible /v1 (the node 9Router points at)
  connect   Register the pool into a running 9Router as one connection per identity
  probe     Call ptero through 9Router N times and report latency + served model
  status    Show upstream /status and this pool's identity quota
  limit     One identity, K paced calls — shows the throttle is per egress IP, not per identity

Mint
  --count <n>          identities to mint                         default 10
  --conc <n>           verifications in flight (the exit pool paces the rate)   default 5
  --pool <file>        pool file, one identity per line           default identities.txt
  --model <id>         model the verification call uses          default deepseek-v4.1-flash:free
  --exits <list>       egress exits: direct,http://h:p,…          default $PTERO_EXITS or "direct"
  --gap <ms>           minimum gap per exit                       default 2600

Shim
  --port <n>           listen port                                default 8791
  --host <addr>        bind address                               default 127.0.0.1
  --pool <file>        pool file to serve                         default identities.txt
  --exits <list>       egress exits: direct,http://h:p,…          default $PTERO_EXITS or "direct"
  --gap <ms>           minimum gap per exit                       default 2600

Connect / probe
  --router <url>       9Router base URL                           default $N9ROUTER or http://127.0.0.1:20128
  --router-password <pw>  9Router login password                  default $N9ROUTER_PW or 123456
  --shim <url>         shim base URL the node should point at    default http://127.0.0.1:8791/v1
  --n <n>              connections (connect) or calls (probe)    default 16 / 5
  --gap <ms>           pause between probe calls                  default 3000
  --tools              probe with a function tool
  --dry                show what connect would do, change nothing

Examples
  ptero-bulk mint --count 250 --conc 16
  ptero-bulk shim --pool identities.txt --port 8791
  ptero-bulk connect --n 16
  ptero-bulk probe --n 5 --model ptero/deepseek-v4.1-flash:free
  ptero-bulk limit --k 12
`;

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const command = args._[0];

  if (!command || args.help || command === 'help') {
    showBanner();
    console.log(HELP);
    return;
  }

  const poolFile = String(args.pool || 'identities.txt');
  const exits = createExits({ exits: typeof args.exits === 'string' ? args.exits : undefined, gapMs: args.gap });

  switch (command) {
    case 'mint':
      return cmdMint(args, poolFile, exits);
    case 'shim':
      return cmdShim(args, poolFile, exits);
    case 'connect':
      return cmdConnect(args, poolFile);
    case 'probe':
      return cmdProbe(args);
    case 'status':
      return cmdStatus(poolFile, exits);
    case 'limit':
      return cmdLimit(args, exits);
    default:
      console.error(`unknown command: ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

async function cmdMint(args, poolFile, exits) {
  showBanner();
  const count = Number(args.count || 10);
  const conc = Number(args.conc || 5);
  const model = resolveModel(String(args.model || ''));
  console.log(`[mint] ${count} identity/identities · conc=${conc} · model=${model} · exits=${exitsSummary(exits)}`);
  const r = await mintIdentities({ count, conc, outFile: poolFile, model, exits, log: console.log });
  const perMin = r.seconds > 0 ? r.verified.length / (r.seconds / 60) : 0;
  console.log(`[mint] done: ${r.verified.length}/${r.total} verified in ${r.seconds.toFixed(1)}s` +
    ` (${perMin.toFixed(1)} identities/min, ${Math.round(perMin * 60)}/hour)`);
  console.log(`[mint] pool: ${r.fileSize} verified identities in ${r.file}`);
  if (r.failed.length) console.log(`[mint] first failure: ${r.failed[0].identity.slice(0, 8)}… ${r.failed[0].error}`);
}

async function cmdShim(args, poolFile, exits) {
  const { url, pool } = await startShim({
    port: Number(args.port || process.env.PORT || 8791),
    host: String(args.host || '127.0.0.1'),
    poolFile,
    exits,
  });
  showBanner();
  console.log(`[shim] ${url}   pool=${pool.size}   models=${MODELS.length}`);
  console.log('[shim] POST a chat with `Authorization: Bearer <32-hex>` to pin one identity, or omit it to round-robin.');
}

async function cmdConnect(args, poolFile) {
  const identities = readPool(poolFile);
  if (!identities.length) {
    console.error(`no identities in ${poolFile} — run: node src/cli.js mint --count 10`);
    process.exitCode = 1;
    return;
  }
  const r = await router.sync({
    base: String(args.router || process.env.N9ROUTER || 'http://127.0.0.1:20128'),
    password: String(args.routerPassword || process.env.N9ROUTER_PW || '123456'),
    shimUrl: String(args.shim || 'http://127.0.0.1:8791/v1'),
    identities,
    n: Number(args.n || 16),
    dry: Boolean(args.dry),
  });
  if (r.clientKey) {
    console.log(`[connect] endpoint ${r.baseUrl}   client key ${r.clientKey}`);
    console.log(`[connect] models: ${r.models.join(', ') || '(none)'}`);
    console.log('[connect] set N9ROUTER_KEY to that key to run: ptero-bulk probe --n 5');
  }
}

async function cmdProbe(args) {
  const base = String(args.router || process.env.N9ROUTER || 'http://127.0.0.1:20128').replace(/\/$/, '');
  const clientKey = process.env.N9ROUTER_KEY || '';
  if (!clientKey) throw new Error('set N9ROUTER_KEY to a 9Router client key (see: ptero-bulk connect)');
  const model = String(args.model || 'ptero/deepseek-v4.1-flash:free');
  const n = Number(args.n || 5);
  const gap = Number(args.gap || 3000);
  const tools = args.tools
    ? [{ type: 'function', function: { name: 'get_weather', description: 'Get current weather', parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] } } }]
    : undefined;
  const lats = [];
  let ok = 0;
  for (let i = 1; i <= n; i++) {
    const r = await router.probe(base, clientKey, tools
      ? { model, message: 'What is the weather in Istanbul? Use the tool.', tools }
      : { model });
    lats.push(r.ms);
    if (r.status === 200 && !r.error) ok++;
    console.log(`  ${i}/${n} ${r.status} ${r.ms}ms  ${r.model_used || r.error || ''}` +
      (r.tool_calls ? `  tool_calls=${r.tool_calls.length}` : ''));
    if (i < n && gap) await new Promise((res) => setTimeout(res, gap));
  }
  const sorted = lats.sort((a, b) => a - b);
  const q = (p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0);
  console.log(`[probe] ${ok}/${n} ok   p50=${q(0.5)}ms p90=${q(0.9)}ms max=${sorted[sorted.length - 1] || 0}ms`);
}

async function cmdStatus(poolFile, exits) {
  const client = new Ptero({ exits });
  const status = await client.status();
  const usage = await client.usage();
  console.log('[status] upstream /status:', JSON.stringify(status));
  console.log('[status] this identity /usage:', JSON.stringify(usage));
  console.log(`[status] pool file ${poolFile}: ${readPool(poolFile).length} verified identities`);
  console.log('[status] catalogue:', MODELS.join(', '));
}

async function cmdLimit(args, exits) {
  const k = Number(args.k || 12);
  const gap = Number(args.gap || 2700);
  const client = new Ptero({ token: newIdentity(), exits });
  const before = await client.usage();
  let ok = 0;
  let charged = 0;
  for (let i = 1; i <= k; i++) {
    try {
      const { meta } = await client.chat('Reply with the single word: ok', { model: 'deepseek-v4.1-flash:free' });
      ok++;
      charged += meta.usage_tokens || 0;
    } catch (e) {
      console.log(`  ${i}/${k} FAIL ${e.message}`);
    }
    if (i < k) await new Promise((r) => setTimeout(r, gap));
  }
  const after = await client.usage();
  console.log(`[limit] one identity, ${k} paced calls → ok=${ok}/${k}, tokens charged=${after.used - before.used} (hourly bucket ${after.max})`);
  console.log('[limit] what throttles you is the egress IP, not the identity — add exits, not identities.');
}

function exitsSummary(exits) {
  const list = (exits || createExits({})).list.filter((e) => e.usable);
  return `${list.length} (${list.map((e) => e.url).join(', ')})`;
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});