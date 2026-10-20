'use strict';

/**
 * ptero-bulk shim — OpenAI-compatible front end for a pool of ptero.pro identities.
 *
 *   node src/shim.js --port 8791 --pool identities.txt
 *
 * Routes
 *   GET  /v1/models               catalogue as OpenAI model ids (`ptero/<id>`)
 *   POST /v1/chat/completions      blocking or `stream: true`
 *   GET  /health                  { ok, pool, exits }
 *   GET  /pool                    pool size + how many identities are cooling down
 *   POST /pool/reload             re-read the pool file
 *
 * Which identity serves a request:
 *   1. `Authorization: Bearer <32-hex>` → exactly that identity. That is what makes 9Router's
 *      one-connection-per-key model meaningful: each connection is one real ptero identity.
 *   2. no bearer → round-robin over the pool, with 60 s cooldown and failover on error.
 *   3. empty pool → a throwaway identity is minted per request, so the shim still works before
 *      you have minted anything.
 *
 * Every blocking response carries a `ptero` block with the model that actually answered
 * (`model_used`), the conversation id, the latency and the identity prefix — so a request
 * through a router can be traced end to end. Streaming responses carry `choices` deltas only.
 */

const http = require('http');
const crypto = require('crypto');
const { VerifiedPool, readPool } = require('./lib/pool.js');
const { MODELS, resolveModel } = require('./lib/models.js');
const { sharedExits } = require('./lib/exits.js');
const { toolInstructions, parseToolCalls } = require('./lib/tools.js');

const DEFAULT_PORT = 8791;
const DEFAULT_HOST = '127.0.0.1';

const completionId = () => 'chatcmpl-' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);

/** Flatten OpenAI `messages` into ptero's `message` + `history` pair. */
function toPrompt(messages) {
  const list = Array.isArray(messages) ? messages : [];
  const content = (m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? ''));
  if (list.length <= 1) return { message: content(list[0] || {}), history: [] };
  return {
    message: content(list[list.length - 1]),
    history: list.slice(0, -1).map((m) => ({ role: m.role, text: content(m) })),
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

/**
 * Start the shim.
 * @param {{port?: number, host?: string, poolFile?: string, exits?: object}} [opts]
 * @returns {Promise<{server: import('http').Server, pool: VerifiedPool, url: string}>}
 */
function startShim({ port = DEFAULT_PORT, host = DEFAULT_HOST, poolFile, exits } = {}) {
  const exitPool = exits || sharedExits();
  const pool = new VerifiedPool(poolFile, exitPool);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    // Every route answers with or without the `/v1` prefix, so the diagnostics work whether
    // you point a browser at `http://127.0.0.1:8791/health` or at `…/v1/health`.
    const route = url.pathname.replace(/^\/v1(?=\/|$)/, '') || '/';

    const json = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (route === '/health') {
      return json(200, {
        ok: true,
        pool: pool.size,
        exits: exitPool.list.filter((e) => e.usable).length,
        capacity_per_minute: exitPool.capacityPerMinute(),
      });
    }
    if (route === '/pool') {
      return json(200, {
        size: pool.size,
        cooling: pool.cooling,
        members: pool.identities.members.map((id) => ({
          identity: id.slice(0, 8) + '…',
          cooldown_ms: Math.max(0, (pool.identities.cooldown.get(id) || 0) - Date.now()),
        })),
      });
    }
    if (route === '/pool/reload') {
      return json(200, { ok: true, size: pool.reload() });
    }
    if (route === '/models') {
      const now = Math.floor(Date.now() / 1000);
      return json(200, {
        object: 'list',
        data: MODELS.map((id) => ({ id: `ptero/${id}`, object: 'model', created: now, owned_by: 'ptero' })),
      });
    }

    if (route === '/chat/completions') {
      let payload;
      try {
        payload = JSON.parse((await readBody(req)) || '{}');
      } catch {
        return json(400, { error: { message: 'invalid JSON body', type: 'invalid_request_error' } });
      }
      return respond(req, res, pool, payload, json);
    }

    return json(404, { error: { message: 'not found' } });
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      resolve({ server, pool, url: `http://${host}:${server.address().port}/v1` });
    });
  });
}

/** One /v1/chat/completions request, blocking or streaming. */
async function respond(req, res, pool, payload, json) {
  const model = resolveModel(payload.model);
  const { message, history } = toPrompt(payload.messages);
  const tools = Array.isArray(payload.tools) && payload.tools.length ? payload.tools : null;
  // Tool calling only exists in the shim, and only when the caller asked for it.
  const prompt = tools ? toolInstructions(tools) + '\n\n' + message : message;
  const conversationId = payload.conversation_id || crypto.randomUUID();
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const id = completionId();
  const created = Math.floor(Date.now() / 1000);

  if (payload.stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const chunk = (delta, finish) =>
      res.write(
        'data: ' +
          JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model: `ptero/${model}`,
            choices: [{ index: 0, delta, finish_reason: finish ?? null }],
          }) +
          '\n\n'
      );
    try {
      if (tools) {
        // Buffered on purpose: a tool call must be recognised before any content is emitted.
        const out = await pool.chat({ bearer, message: prompt, model, conversationId, history });
        const { calls, cleaned } = parseToolCalls(out.text);
        chunk({ role: 'assistant' }, null);
        if (calls.length) chunk({ tool_calls: calls.map((c, i) => ({ index: i, ...c })) }, 'tool_calls');
        else {
          if (cleaned) chunk({ content: cleaned }, null);
          chunk({}, 'stop');
        }
      } else {
        let started = false;
        await pool.chat({
          bearer,
          message: prompt,
          model,
          conversationId,
          history,
          onToken: (token) => {
            if (!started) { chunk({ role: 'assistant' }, null); started = true; }
            chunk({ content: token }, null);
          },
        });
        chunk({}, 'stop');
      }
      res.write('data: [DONE]\n\n');
    } catch (e) {
      res.write('data: ' + JSON.stringify({ error: { message: e.message } }) + '\n\n');
    }
    return res.end();
  }

  try {
    const t0 = Date.now();
    const out = await pool.chat({ bearer, message: prompt, model, conversationId, history });
    const lifted = tools ? parseToolCalls(out.text) : { calls: [], cleaned: out.text };
    const messageOut = lifted.calls.length
      ? { role: 'assistant', content: lifted.cleaned || null, tool_calls: lifted.calls }
      : { role: 'assistant', content: out.text };
    return json(200, {
      id,
      object: 'chat.completion',
      created,
      model: `ptero/${model}`,
      choices: [
        {
          index: 0,
          message: messageOut,
          finish_reason: lifted.calls.length ? 'tool_calls' : 'stop',
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: out.meta.usage_tokens || 0,
        total_tokens: out.meta.usage_tokens || 0,
      },
      ptero: {
        model_used: out.meta.model_used,
        conversation_id: out.meta.conversation_id,
        latency_ms: Date.now() - t0,
        identity: out.identity.slice(0, 8) + '…',
        tools: tools ? tools.length : 0,
      },
    });
  } catch (e) {
    return json(502, { error: { message: e.message, type: 'upstream_error' } });
  }
}

module.exports = { startShim, DEFAULT_PORT, DEFAULT_HOST, readPool };