<div align="center">

```
██████╗    ████████╗  ███████╗   ██████╗     ██████╗
██╔══██╗   ╚══██╔══╝  ██╔════╝   ██╔══██╗   ██╔════╝
██████╔╝      ██║     █████╗     ██████╔╝   ███████╗
██╔══██║      ██║     ██╔══╝     ██╔══██║   ██╔══██║
██║  ██║      ██║     ███████╗   ██║  ██║   ██║  ██║
╚═╝  ╚═╝      ╚═╝     ╚══════╝   ╚═╝  ╚═╝   ╚═╝  ╚═╝
```
<img src="brand/logo.svg" alt="ptero-bulk" width="150" />

# ptero-bulk-apikey

**Bulk-mint [ptero.pro](https://ptero.pro) identities — no signup, no e-mail, no captcha — and serve `deepseek-v4.1-flash` through a local OpenAI-compatible shim, registered into a running [9Router](https://9router.com) instance. Zero required dependencies.**

[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639.svg?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/required%20deps-0-blue.svg?style=for-the-badge)](#)
[![OpenAI compatible](https://img.shields.io/badge/API-OpenAI--compatible-412991.svg?style=for-the-badge&logo=openai&logoColor=white)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6.svg?style=for-the-badge)](#-connect-to-9router)
[![Proxy](https://img.shields.io/badge/transport-HTTP%20%7C%20SOCKS5-0EA5E9.svg?style=for-the-badge)](#-transports)
[![No signup](https://img.shields.io/badge/signup-none-22C55E.svg?style=for-the-badge)](https://ptero.pro)
[![Languages](https://img.shields.io/badge/i18n-5%20languages-F59E0B.svg?style=for-the-badge)](#-languages)

[English](README.md) · [Bahasa Indonesia](i18n/README.id.md) · [简体中文](i18n/README.zh.md) · [日本語](i18n/README.ja.md) · [Español](i18n/README.es.md) · [Deutsch](i18n/README.de.md)

</div>

---

## ✨ Features

- 🪶 **No signup at all** — a ptero identity is a random 32-hex token you generate yourself. No account, no e-mail, no password, no captcha. Minting is offline and instant.
- 🔑 **Bulk mint + verify** — identities are only written to the pool after they answer a *real* chat request, so every line in the pool has a measured HTTP 200 behind it.
- 🔌 **OpenAI-compatible shim** — one `http://127.0.0.1:8791/v1` serving `deepseek-v4.1-flash` and the rest of the catalogue, with `stream`, `tools` and per-request identity pinning.
- 🔀 **Exit-aware pacing** — the real limit is a *per-egress-IP* throttle, so the client reserves an exit per request and queues instead of tripping `429`.
- 🧰 **9Router connector** — registers the shim as a provider node with **one connection per identity**, so each 9Router connection is one real ptero identity.
- 🛠 **Lifted tool calling** — upstream has no `tools` field; the shim teaches the model a text tool-call block and lifts it back into real `tool_calls`.
- 🧩 **Library or CLI** — use `Ptero`/`VerifiedPool` in code, or run the bundled `ptero-bulk` command.
- 🌍 **5 languages** — EN, ID, ZH, JA, ES, DE.

## 🚀 Quick start

```bash
git clone https://github.com/F0Rextasy/ptero-bulk-apikey
cd ptero-bulk-apikey

# 1. mint 50 identities (each verified with a real deepseek-v4.1-flash call)
node src/cli.js mint --count 50 --conc 8

# 2. serve them as OpenAI
node src/cli.js shim --pool identities.txt --port 8791

# 3. register the pool into a running 9Router
node src/cli.js connect --n 16
```

Then call it like any OpenAI endpoint:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}]}'
```

## 🛠 Usage

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                  # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                          # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                    # prove the throttle is per exit, not per identity
```

| Flag | Description | Default |
| --- | --- | --- |
| `--count <n>` | identities to mint | `10` |
| `--conc <n>` | verifications in flight (the exit pool paces the rate) | `5` |
| `--pool <file>` | pool file, one identity per line | `identities.txt` |
| `--model <id>` | model the verification / probe call uses | `deepseek-v4.1-flash:free` |
| `--port <n>` | shim listen port | `8791` |
| `--host <addr>` | shim bind address | `127.0.0.1` |
| `--exits <list>` | egress exits: `direct,http://host:port,…` | `$PTERO_EXITS` or `direct` |
| `--gap <ms>` | minimum gap between two calls on one exit | `2600` |
| `--router <url>` | 9Router base URL | `$N9ROUTER` or `http://127.0.0.1:20128` |
| `--router-password <pw>` | 9Router login password | `$N9ROUTER_PW` or `123456` |
| `--shim <url>` | shim base URL the 9Router node points at | `http://127.0.0.1:8791/v1` |
| `--n <n>` | connections (connect) or calls (probe) | `16` / `5` |
| `--tools` | probe with a function tool | off |
| `--dry` | show what `connect` would do, change nothing | off |

Environment: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🌐 Transports

ptero needs **no** exit at all to work — a direct connection is fine, it just starts rate-limiting sooner once you push traffic. The `429 Too many messages` throttle is **per egress IP**, so:

- **direct** (default) — one bucket, fine for a local shim or light use.
- **HTTP / SOCKS5 proxy** — `--exits direct,http://user:pass@host:port,…` or `PTERO_EXITS`. Proxied exits need the optional `undici` package; if it is absent those exits are skipped with a warning and the direct exit still serves.
- **Multiple exits** — each exit is its own bucket. The client reserves one exit per request, honours `--gap`/`PTERO_EXIT_GAP` (2600 ms default), and on a `429` parks only that exit for 20 s and retries on the next. Four exits at a 2.6 s gap ≈ **92 calls/min** fleet-wide.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

## 🔌 Connect to 9Router

9Router is a self-hosted, OpenAI-compatible router:

```bash
npm install -g 9router && 9router        # dashboard on http://localhost:20128
```

ptero does not speak plain HTTP chat, so the connector points 9Router's `openai-compatible` node at this repo's shim and attaches **one connection per pool identity** — each connection's `Authorization: Bearer <32-hex>` makes the shim route it to that exact identity:

```
node src/connect-9router.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
```

That registers:

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

Point any OpenAI-compatible client at it:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🧠 Available models

The catalogue is hardcoded in ptero's site bundle (there is no upstream `/models` route) and changes without notice. As served on 2026-10-17:

| Model                     | Call as in 9Router                    | Notes |
| ------------------------- | ------------------------------------- | ----- |
| deepseek-v4.1-flash:free  | `ptero/deepseek-v4.1-flash:free`      | ✅ the flagship; measured through 9Router |
| ling-3.0-flash:free       | `ptero/ling-3.0-flash:free`           | ✅ |
| mistral-nemo:minirouter   | `ptero/mistral-nemo:minirouter`       | ✅ |
| qwen3.7-flash:minirouter  | `ptero/qwen3.7-flash:minirouter`      | ✅ reported as the site default |
| apodex-1.1-mini:free      | `ptero/apodex-1.1-mini:free`          | ✅ |

`GET /status` also reports which ids are `disabled` / in `cooldown_models` — run `ptero-bulk status` to see the live values. Short aliases (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) all resolve to the id above.

## 📚 As a library

```js
const { Ptero } = require('ptero-bulk-apikey/src/lib/ptero.js');
const { mintIdentities, VerifiedPool } = require('ptero-bulk-apikey/src/lib/pool.js');

// one identity, one chat — no pool needed
const client = new Ptero();
const { text, meta } = await client.chat('Reply with the single word: ok', {
  model: 'deepseek-v4.1-flash:free',
});
console.log(text, meta.model_used);

// or a verified pool with failover
await mintIdentities({ count: 10, conc: 4, outFile: 'identities.txt' });
const pool = new VerifiedPool('identities.txt');
const out = await pool.chat({ message: 'hi', model: 'deepseek-v4.1-flash:free' });
console.log(out.identity, out.meta.model_used);
```

Runnable samples: [`examples/mint-and-chat.js`](examples/mint-and-chat.js), [`examples/shim-and-router.js`](examples/shim-and-router.js).

## ⚙️ How it works

ptero.pro has no registration. An identity is a token *you* generate and send as `X-MLP-Guest-Token`; the only other thing a request needs is the site's WordPress REST nonce.

1. **Mint** — `crypto.randomUUID().replace(/-/g,'')` → a 32-hex `X-MLP-Guest-Token` (plus a random display name). Instant, offline, no server call.
2. **Scrape the nonce** — `GET https://ptero.pro/` → the HTML contains `var nonce = "<10 hex>"`. Every request needs it as `X-WP-Nonce`; it is guest-wide, every response echoes a fresh one back, and a `403 rest_cookie_invalid_nonce` forces a re-scrape. It is never hardcoded.
3. **Chat** — `POST /wp-json/mlp/v1/chat-stream` with `{message, model, conversation_id, attachments, history, lang, mode}` → `200 text/event-stream` with events `phase · activity · progress · thinking · token · done`. The `done` event carries `{model_used, usage_tokens, conversation_id}`.
4. **Verify** — during `mint`, the identity must answer a real chat request before it is written to the pool file.
5. **Serve** — the shim picks an identity per request (bearer-pinned, else round-robin with 60 s cooldown + failover) on an exit reserved for `PTERO_EXIT_GAP` ms, and answers OpenAI `/v1/chat/completions`.
6. **Route** — 9Router's `ptero` node points at the shim; one connection per identity.

Other endpoints: `/status` (health + default model), `/usage` (the identity's token bucket — `max: 1000000`, `reset_seconds: 3600`), `/api-keys` (a guest's own key list; empty on a fresh identity).

See [`docs/PROTOCOL.md`](docs/PROTOCOL.md) for the exact wire format.

## ⚠️ Notes & limits

- **The limit is per egress IP, not per identity.** Measured: on one exit a 0 ms gap between calls gives 0/6 OK, 1000 ms gives 2/6, 2500 ms gives 6/6. A brand-new identity 429s instantly while an exit is hot, and the same second the same model answers 200 over a different exit. **Identities buy resilience; exits buy throughput.** Add exits, not identities, when you need more calls/min. The per-identity bucket is real but generous (1,000,000 tokens/hour).
- **The model table goes stale.** ptero has no `/models` route; the ids live in the site bundle. If a model 404s, re-check the live bundle rather than trusting this table.
- **Tool calling only exists in the shim.** Upstream there is no `tools` field and no `tool_calls` SSE frame; the shim teaches the model a text block and lifts it into real `tool_calls` — and only when your request carries `tools`.
- **The catalogue is unverified-per-model.** All five ids were served at once; `deepseek-v4.1-flash:free` is the one re-measured repeatedly through 9Router (p50 ≈ 2.2 s, p90 ≈ 3.3 s over 12 paced calls).
- The pool file contains credentials, however anonymous — it is git-ignored, and this repo ships none.
- For personal/educational automation. Respect ptero.pro's and 9Router's terms of service.

## 📁 Layout

```
ptero-bulk-apikey/
├── brand/                 logo.svg · icon.svg
├── docs/PROTOCOL.md       ptero.pro wire format, step by step
├── examples/              mint-and-chat.js · shim-and-router.js
├── i18n/                  README in id · zh · ja · es · de
├── src/
│   ├── cli.js             mint · shim · connect · probe · status · limit
│   ├── shim.js            OpenAI-compatible /v1 over a verified pool
│   ├── launcher.js        PTERO ASCII banner
│   ├── connect-9router.js provider-node + one connection per identity
│   └── lib/
│       ├── ptero.js       client: nonce scrape, SSE chat-stream
│       ├── identity.js    32-hex identity minting + round-robin pool
│       ├── pool.js        verified mint + failover pool
│       ├── exits.js       egress-exit reservation, pacing, 429 penalties
│       ├── tools.js       text tool-call block ⇄ real tool_calls
│       └── models.js      catalogue + alias resolution
└── package.json
```

## 📄 License

[MIT](LICENSE) © 2026 ptero-bulk-apikey contributors