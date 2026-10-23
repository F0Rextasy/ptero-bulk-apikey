<div align="center">

```
██████╗ ████████╗███████╗██████╗  ██████╗
██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔═══██╗
██████╔╝   ██║   █████╗  ██████╔╝██║   ██║
██╔═══╝    ██║   ██╔══╝  ██╔══██╗██║   ██║
██║        ██║   ███████╗██║  ██║╚██████╔╝
╚═╝        ╚═╝   ╚══════╝╚═╝  ╚═╝ ╚═════╝
```

# ptero-bulk-apikey

**Bulk-mint ptero.pro identities with auto-generated API keys — OpenAI-compatible inference through a local shim (deepseek-v4.1-flash and the rest of the catalogue) + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-5-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 Free tier — how much you get

**ptero.pro has no registration at all: an identity is a random 32-hex token you generate yourself, so there is nothing to pay for and nothing to sign up to.**

| What | Value |
| --- | --- |
| Account required | **None** — no e-mail, no password, no captcha, no card |
| Mint cost | **zero** — the token is generated offline, instantly |
| Per-identity bucket | **1,000,000 tokens / hour** (`max: 1000000`, `reset_seconds: 3600` from `/usage`) |
| Real throughput limit | **per egress IP**, not per identity — see the table below |
| What one identity buys | resilience (cooldown + failover), not throughput |
| The unit that scales | **exits**, not identities → add exits when you need more calls/min |

**Measured on one exit** (`deepseek-v4.1-flash:free`, gap between calls → successes out of 6):

| Gap | Result |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

Four exits at a 2.6 s gap ≈ **92 calls/min** fleet-wide.

> 💡 The free tier is set by ptero.pro and can change. Check the live numbers at [ptero.pro](https://ptero.pro) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 5 of them

The catalogue is hardcoded in ptero's site bundle (there is no upstream `/models` route) and changes without notice. As served on 2026-10-17:

| Model | Call as in 9Router | Notes |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ the flagship; measured through 9Router (p50 ≈ 2.2 s, p90 ≈ 3.3 s over 12 paced calls) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ reported as the site default |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` also reports which ids are `disabled` / in `cooldown_models` — run `ptero-bulk status` to see the live values. Short aliases (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) all resolve to the id above. If a model 404s, re-check the live bundle rather than trusting this table.

## 🧪 How to use the API

ptero does not speak plain HTTP chat upstream — it answers an SSE stream on its own route. This repository's **shim** turns that into an ordinary OpenAI surface on **`http://127.0.0.1:8791/v1`**:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

The shim supports `stream`, `tools` (lifted from the model's text tool-call block into real `tool_calls`) and per-request identity pinning: a bearer that matches a pool identity routes to that exact identity, otherwise it round-robins with 60 s cooldown + failover.

## 🛠 Quick start

```bash
# clone or fork this repository, then:
cd ptero-bulk-apikey

# 1) mint identities (each verified with a real deepseek-v4.1-flash call)
node src/cli.js mint --count 50 --conc 8

# 2) serve them as OpenAI
node src/cli.js shim --pool identities.txt --port 8791

# 3) register the pool into a running 9Router
node src/cli.js connect --n 16
```

`identities.txt` holds one 32-hex identity per line, and only identities that answered a real chat call are written to it.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` holds one 32-hex identity per line, and only identities that answered a real chat call are written to it.
### 🖱️ The launcher

There is no interactive menu here — the CLI is the interface and every task is one command (`mint`, `shim`, `connect`, `probe`, `status`, `limit`). `node src/cli.js` with no task prints the PTERO banner and the task list, and every flag also has an environment variable (`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

The same launcher shortcut registers the pool without spelling out the connector: `node src/launcher.js --connect-9router …` hands the rest of the command line to `src/connect-9router.js` and `node src/launcher.js --connect-omniroute …` hands it to `src/connect-omniroute.js`; with neither flag it just prints the PTERO banner.

## ✅ Verified working — every key is tested

| Check | Result |
| --- | --- |
| identity mint | `crypto.randomUUID().replace(/-/g,'')` → a 32-hex `X-MLP-Guest-Token`; instant, offline, no server call |
| nonce scrape | `GET https://ptero.pro/` carries `var nonce = "<10 hex>"`; a `403 rest_cookie_invalid_nonce` forces a re-scrape, it is never hardcoded |
| live proof | the identity must answer a real `POST /wp-json/mlp/v1/chat-stream` before it is written to the pool file |
| through 9Router | `ptero-bulk probe` — measured p50 ≈ 2.2 s, p90 ≈ 3.3 s over 12 paced calls on `deepseek-v4.1-flash:free` |
| pool file | contains credentials, however anonymous — it is git-ignored and this repo ships none |

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro has no registration. An identity is a token *you* generate and send as `X-MLP-Guest-Token`; the only other thing a request needs is the site's WordPress REST nonce.

| Step | Call | Notes |
| --- | --- | --- |
| mint | local | `crypto.randomUUID().replace(/-/g,'')` → 32-hex identity + a random display name |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`; guest-wide, every response echoes a fresh one |
| chat | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream` with events `phase · activity · progress · thinking · token · done`; `done` carries `{model_used, usage_tokens, conversation_id}` |
| verify | same call | the identity must answer a real chat before it is written to the pool |
| serve | local shim | picks an identity per request on an exit reserved for `PTERO_EXIT_GAP` ms, answers OpenAI `/v1/chat/completions` |
| route | 9Router | the `ptero` node points at the shim; one connection per identity |

Other endpoints: `/status` (health + default model), `/usage` (the identity's token bucket), `/api-keys` (a guest's own key list; empty on a fresh identity). The exact wire format is in [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## ⚙️ CLI options

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| Flag | Meaning | Default |
| --- | --- | --- |
| `--count <n>` | identities to mint | `10` |
| `--conc <n>` | verifications in flight (the exit pool paces the rate) | `5` |
| `--pool <file>` | pool file, one identity per line | `identities.txt` |
| `--model <id>` | model the verification / probe call uses | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | shim listen port / bind address | `8791` / `127.0.0.1` |
| `--exits <list>` | egress exits: `direct,http://host:port,…` | `$PTERO_EXITS` or `direct` |
| `--gap <ms>` | minimum gap between two calls on one exit | `2600` |
| `--router <url>` / `--router-password <pw>` | 9Router base / login password | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | shim base URL the 9Router node points at | `http://127.0.0.1:8791/v1` |
| `--n <n>` | connections (connect) or calls (probe) | `16` / `5` |
| `--tools` / `--dry` | probe with a function tool / show what `connect` would do | off / off |

Environment: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ Behind a proxy

ptero needs **no** exit at all to work — a direct connection is fine, it just starts rate-limiting sooner once you push traffic. The `429 Too many messages` throttle is **per egress IP**, so:

- **direct** (default) — one bucket, fine for a local shim or light use.
- **HTTP / SOCKS5 proxy** — `--exits direct,http://user:pass@host:port,…` or `PTERO_EXITS`. Proxied exits need the optional `undici` package; if it is absent those exits are skipped with a warning and the direct exit still serves.
- **Multiple exits** — each exit is its own bucket. The client reserves one exit per request, honours `--gap` / `PTERO_EXIT_GAP` (2600 ms default), and on a `429` parks only that exit for 20 s and retries on the next.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**Identities buy resilience; exits buy throughput.** A brand-new identity 429s instantly while an exit is hot, and the same second the same model answers 200 over a different exit.

## 📄 Files

| Path | Contents |
| --- | --- |
| `identities.txt` | one verified 32-hex identity per line — git-ignored (credentials, however anonymous) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | the OpenAI-compatible `/v1` over a verified pool |
| `src/connect-9router.js` | provider-node + one connection per identity |
| `src/lib/` | `ptero.js` (nonce scrape, SSE chat-stream), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | ptero.pro wire format, step by step |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router (`npm install -g 9router && 9router`, dashboard on `http://localhost:20128`).

ptero does not speak plain HTTP chat, so the connector points 9Router's `openai-compatible` node at this repo's **shim** and attaches **one connection per pool identity** — each connection's `Authorization: Bearer <32-hex>` makes the shim route it to that exact identity:

```bash
node src/connect-9router.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
# or: ptero-bulk connect --n 16
```

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🔌 Connect to OmniRoute

[OmniRoute](https://omniroute.online) is a self-hosted, OpenAI-compatible router (`npm install -g omniroute && omniroute`, dashboard on `http://localhost:20128`).

ptero does not speak plain HTTP chat, so the connector points OmniRoute's `openai-compatible` node at this repo's **shim** and attaches **one connection per pool identity** — each connection's `Authorization: Bearer <32-hex>` makes the shim route it to that exact identity:

```bash
node src/connect-omniroute.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
# or: ptero-bulk connect --n 16
```

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<omniroute key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 What the provider gives | no signup, no e-mail, no captcha — 1,000,000 tokens/hour per identity, throughput set by your exits |
| 🔑 What one key gets you | one API key scoped to its own account: the 5 model ids on the endpoint below, at your plan's limits. The quota lives on the **account**, which is exactly why this tool creates one account per key |
| 🌐 API shape | OpenAI-compatible: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 Your data | only ptero.pro and the inbox backend you configure are contacted; keys stay on your machine |

## 🐞 Issues

If ptero.pro changes the nonce shape, the chat-stream route or the model ids, the tool stops at that step and says so. **[Open an issue](../../issues)** with the command you ran and the exact output; PRs are welcome.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>
