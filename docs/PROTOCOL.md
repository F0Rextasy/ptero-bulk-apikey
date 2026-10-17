# ptero.pro wire protocol

Everything this toolkit does, reduced to the HTTP. Measured 2026-10-17 against the live site.

Base namespace: `https://ptero.pro/wp-json/mlp/v1`
Homepage (nonce source): `https://ptero.pro/`

## 1. There is no signup

ptero.pro serves anonymous guest chat. No account, no e-mail, no password, no captcha, and no
API key is issued — `GET /api-keys` returns `{"verified":false,"keys":[]}` for a fresh guest.

An **identity** is a token the client invents:

```
identity : crypto.randomUUID().replace(/-/g,'')     // 32 lowercase hex
header   : X-MLP-Guest-Token: <identity>
header   : X-MLP-Guest-Username: <any display name>
```

Minting is therefore instant and offline. Nothing is registered anywhere.

## 2. The nonce

Every request also needs the site's WordPress REST nonce:

```
GET https://ptero.pro/
→ HTML containing   var nonce = "<10 hex>"
header : X-WP-Nonce: <nonce>
```

* The nonce is **guest-wide** — the same value serves every identity.
* It **rotates**: every response echoes a fresh one in the `x-wp-nonce` response header. Adopt it.
* A stale one answers `403 rest_cookie_invalid_nonce` → re-scrape the homepage and retry.
* It is not an API key and must never be hardcoded in a client (a hardcoded value stops working).

## 3. Chat (SSE)

```
POST https://ptero.pro/wp-json/mlp/v1/chat-stream
headers:
  Content-Type: application/json
  X-WP-Nonce: <nonce>
  X-MLP-Guest-Token: <identity>
  X-MLP-Guest-Username: <name>
  Origin: https://ptero.pro
  Referer: https://ptero.pro/
  Accept: application/json, text/event-stream
body:
  {
    "message": "Reply with the single word: ok",
    "model": "deepseek-v4.1-flash:free",
    "conversation_id": "<uuid>",
    "attachments": [],
    "history": [],
    "lang": "en",
    "mode": "chat"
  }
```

Response: `200 text/event-stream`, events of the form `data: {json}`. The event keys seen are
`phase · activity · progress · thinking · token · done`. Concatenate the `token` values for the
answer; the `done` event carries:

```
data: {"done":true,"model_used":"deepseek-v4.1-flash:free","usage_tokens":5,
       "conversation_id":"…"}
```

`model_used` is the model that actually served — check it if you care that the requested model
answered.

## 4. Other endpoints

| Endpoint | Returns |
| --- | --- |
| `GET /status` | `{disabled, disabled_models[], cooldown_models[], default_model}` |
| `GET /usage` | `{used, max:1000000, base_max, bonus_tokens, remaining, reset_seconds, window_seconds, unlimited}` |
| `GET /api-keys` | `{verified:false, keys:[]}` — ptero issues no keys |

There is **no** `/models` route. The catalogue is hardcoded in the site bundle and changes
without notice; on 2026-10-17 it served `deepseek-v4.1-flash:free`, `ling-3.0-flash:free`,
`mistral-nemo:minirouter`, `qwen3.7-flash:minirouter`, `apodex-1.1-mini:free`, with
`default_model: qwen3.7-flash:minirouter`.

## 5. The throttle is per egress IP

`429` body: `Too many messages — please slow down and try again in a moment.`

Measured on one exit, fresh identity for every call:

| Gap between calls | Result |
| --- | --- |
| 0 ms | 0/6 OK |
| 1000 ms | 2/6 OK |
| 2500 ms | 6/6 OK |

A brand-new identity 429s instantly while the IP is hot, and the same second the same model
answers 200 over a different exit. The per-identity bucket is real but far above the throttle
(1,000,000 tokens/hour; a chat call costs 5–380 tokens), so **identities buy resilience, exits
buy throughput**. `src/lib/exits.js` therefore reserves one exit per request with a minimum gap
and parks only the offending exit on a 429.

## 6. Tool calling

Upstream has no `tools` field and no `tool_calls` SSE frame — ever. The model does emit a call,
as text, when asked:

```
<tool_call>{"name":"get_weather","arguments":{"city":"Istanbul"}}</tool_call>
```

`src/lib/tools.js` teaches that block in the prompt and lifts it back into real OpenAI
`tool_calls` — only when the caller sends `tools`, so plain chat is unchanged.

## 7. Shim surface

The shim (`src/shim.js`) exposes:

| Route | Purpose |
| --- | --- |
| `GET /v1/models` | catalogue as OpenAI ids (`ptero/<id>`) |
| `POST /v1/chat/completions` | blocking or `stream: true`, `tools` supported |
| `GET /health` | `{ok, pool, exits, capacity_per_minute}` |
| `GET /pool` | pool size, cooling count, per-identity cooldown |
| `POST /pool/reload` | re-read the pool file |

Identity selection per request:

1. `Authorization: Bearer <32-hex>` → exactly that identity (one 9Router connection = one identity).
2. Otherwise → round-robin over the pool, with 60 s cooldown and failover to the next identity.
3. Empty pool → a throwaway identity is minted per request.

Each response carries a `ptero` block: `{model_used, conversation_id, latency_ms, identity, tools}`.