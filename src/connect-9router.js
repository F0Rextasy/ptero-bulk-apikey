'use strict';

/**
 * 9Router connector (zero dependencies).
 *
 * 9Router is a self-hosted, OpenAI-compatible router:
 *   npm install -g 9router && 9router         # dashboard on http://localhost:20128
 *
 * ptero is not registered directly: ptero speaks SSE at its own `/chat-stream`, so 9Router's
 * `openai-compatible` node is pointed at this repo's shim (`http://127.0.0.1:8791/v1`) and
 * **one connection is created per pool identity**. That is the point of the whole arrangement:
 * 9Router can then keep many requests in flight, and each connection carries its own
 * `Authorization: Bearer <32-hex>` so the shim routes it to that exact ptero identity.
 *
 * Endpoints used (all local, authenticated by the 9Router password cookie):
 *   POST /api/auth/login            { password }          → auth cookie
 *   GET  /api/provider-nodes                              → existing nodes
 *   POST /api/provider-nodes        { type, prefix, baseUrl, apiType, name }
 *   GET  /api/providers                                   → existing connections
 *   POST /api/providers             { provider, apiKey, name }
 *   DELETE /api/providers/:id
 *   GET  /api/keys | POST /api/keys { name }              → 9Router client key (`sk-…`)
 *   GET  /v1/models                                        → model ids, with the client key
 */

const UA = 'ptero-bulk-9router/1.0';

async function login(base, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ password: password ?? '123456' }),
  });
  const setCookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean);
  const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  return { ok: res.ok, cookie, body: (await res.text()).slice(0, 200) };
}

async function apiCall(base, cookie, path, init = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UA,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, ok: res.ok, json, text: text.slice(0, 400) };
}

/** Ensure the `openai-compatible` provider node for the shim exists; returns it. */
async function ensureProviderNode(base, cookie, { name, prefix, baseUrl }) {
  const list = await apiCall(base, cookie, '/api/provider-nodes');
  const nodes = (list.json && list.json.nodes) || [];
  const existing = nodes.find((n) => n.name === name || n.prefix === prefix);
  if (existing) return { node: existing, created: false };
  const created = await apiCall(base, cookie, '/api/provider-nodes', {
    method: 'POST',
    body: JSON.stringify({ name, prefix, apiType: 'chat', type: 'openai-compatible', baseUrl }),
  });
  if (!created.ok) throw new Error(`create provider-node failed ${created.status}: ${created.text}`);
  return { node: created.json.node, created: true };
}

/** Return (or mint) the 9Router client key used to call the local `/v1` API. */
async function ensureClientKey(base, cookie, name = 'ptero') {
  const list = await apiCall(base, cookie, '/api/keys');
  const keys = (list.json && list.json.keys) || [];
  const existing = keys.find((k) => k.name === name && k.isActive);
  if (existing) return existing.key;
  const created = await apiCall(base, cookie, '/api/keys', { method: 'POST', body: JSON.stringify({ name }) });
  if (!created.ok) throw new Error(`create client key failed ${created.status}: ${created.text}`);
  return created.json.key;
}

/** 9Router connection names this connector owns, as `ptero-001`, `ptero-002`, … */
const connectionName = (index) => `${'ptero'}-${String(index).padStart(3, '0')}`;

/**
 * Sync the ptero node: one connection per pool identity, connections beyond `--n` pruned.
 * Connections this connector did not create are reported and left alone.
 *
 * @param {{base?: string, password?: string, shimUrl?: string, identities?: string[], n?: number,
 *          name?: string, prefix?: string, dry?: boolean, log?: (s: string) => void}} opts
 */
async function sync({ base = 'http://localhost:20128', password = '123456', shimUrl = 'http://127.0.0.1:8791/v1',
                      identities = [], n = 16, name = 'Ptero', prefix = 'ptero', dry = false, log = console.log } = {}) {
  const wanted = identities.slice(0, n);
  if (!wanted.length) throw new Error('no ptero identities to register — mint some first (ptero-bulk mint)');
  log(`ptero · ${identities.length} identity/identities, ${wanted.length} connection(s) → ${shimUrl}${dry ? '  [dry]' : ''}`);

  const { cookie, ok, body } = await login(base, password);
  if (!ok && !/already|success|ok/i.test(body)) throw new Error(`9Router login failed: ${body}`);

  const { node, created } = await ensureProviderNode(base, cookie, { name, prefix, baseUrl: shimUrl });
  log(`  node ${created ? 'created' : 'ready'}: ${name} (${prefix})`);

  const list = await apiCall(base, cookie, '/api/providers');
  const all = (list.json && list.json.connections) || [];
  const mine = all.filter((c) => c.provider === node.id);
  const ours = mine.filter((c) => new RegExp(`^${prefix}-\\d{3}$`).test(c.name || ''));
  const foreign = mine.filter((c) => !ours.includes(c));
  if (foreign.length) log(`  ! ${foreign.length} connection(s) under this node are not ours, left untouched: ${foreign.map((c) => c.name).join(', ')}`);

  const byName = new Map(ours.map((c) => [c.name, c]));
  let added = 0;
  for (let i = 0; i < wanted.length; i++) {
    const connName = connectionName(i + 1);
    if (byName.has(connName)) continue;
    if (dry) { log(`  [dry] add ${connName}`); continue; }
    const res = await apiCall(base, cookie, '/api/providers', {
      method: 'POST',
      body: JSON.stringify({ provider: node.id, apiKey: wanted[i], name: connName, baseUrl: shimUrl }),
    });
    if (!res.ok) log(`  ${connName}: ${res.status} ${res.text}`);
    else added++;
  }

  let pruned = 0;
  for (const conn of ours) {
    if (Number(String(conn.name).split('-')[1]) <= wanted.length) continue;
    if (dry) { log(`  [dry] prune ${conn.name}`); continue; }
    const res = await apiCall(base, cookie, `/api/providers/${conn.id}`, { method: 'DELETE' });
    if (res.ok) pruned++;
  }
  log(`  connections: ${ours.length} ours → +${added} -${pruned} = ${ours.length + added - pruned}`);

  const clientKey = dry ? null : await ensureClientKey(base, cookie, prefix);
  const models = clientKey ? await listRouterModels(base, clientKey, { filter: `${prefix}/` }) : [];
  return { nodeId: node.id, clientKey, baseUrl: `${base}/v1`, connections: ours.length + added - pruned, models };
}

/** Model ids the ptero node exposes through 9Router's `/v1/models`. */
async function listRouterModels(base, clientKey, { filter = 'ptero/' } = {}) {
  const res = await fetch(`${base}/v1/models`, { headers: { Authorization: `Bearer ${clientKey}`, 'User-Agent': UA } });
  if (!res.ok) throw new Error(`router /v1/models -> ${res.status}`);
  const data = await res.json();
  const ids = (data.data || []).map((m) => m.id);
  return filter ? ids.filter((id) => id.includes(filter)) : ids;
}

/**
 * Send one chat request through 9Router to a ptero model — the end-to-end proof that the
 * connector works. Returns `{status, ms, model, model_used, content}`.
 */
async function probe(base, clientKey, { model = 'ptero/deepseek-v4.1-flash:free', message = 'Reply with the single word: ok', tools } = {}) {
  const body = { model, messages: [{ role: 'user', content: message }], max_tokens: 32 };
  if (tools) body.tools = tools;
  const t0 = Date.now();
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientKey}`, 'User-Agent': UA },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  const ms = Date.now() - t0;
  const raw = await res.text();
  let json = null;
  try { json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)); } catch { /* SSE frames */ }
  const choice = json && json.choices && json.choices[0];
  return {
    status: res.status,
    ms,
    model: json && json.model,
    model_used: (json && json.ptero && json.ptero.model_used) || null,
    finish_reason: choice && choice.finish_reason,
    content: choice && choice.message && choice.message.content,
    tool_calls: (choice && choice.message && choice.message.tool_calls) || null,
    error: json && json.error ? json.error.message : res.ok ? null : raw.slice(0, 200),
  };
}

module.exports = { login, apiCall, ensureProviderNode, ensureClientKey, sync, listRouterModels, probe, UA };

if (require.main === module) {
  const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
  };
  const { readPool } = require('./lib/pool.js');
  const base = process.env.N9ROUTER || arg('router', 'http://127.0.0.1:20128');
  sync({
    base,
    password: process.env.N9ROUTER_PW || arg('router-password', '123456'),
    shimUrl: arg('shim', 'http://127.0.0.1:8791/v1'),
    identities: readPool(arg('pool', 'identities.txt')),
    n: Number(arg('n', '16')),
    dry: process.argv.includes('--dry'),
  })
    .then((r) => {
      if (r.clientKey) console.log(`client key: ${r.clientKey}   models: ${r.models.join(', ') || '(none)'}`);
    })
    .catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
}