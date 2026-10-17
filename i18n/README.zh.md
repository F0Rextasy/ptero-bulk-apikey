<div align="center">
<img src="../brand/logo.svg" alt="ptero-bulk" width="150" />

# ptero-bulk-apikey

**批量铸造 [ptero.pro](https://ptero.pro) 身份 —— 无需注册、无需邮箱、无需验证码 —— 并通过本地 OpenAI 兼容 shim 提供 `deepseek-v4.1-flash` 服务，同时注册到正在运行的 [9Router](https://9router.com) 实例。零必需依赖。**

[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/required%20deps-0-blue.svg?style=for-the-badge)](#)
[![OpenAI compatible](https://img.shields.io/badge/API-OpenAI--compatible-412991.svg?style=for-the-badge&logo=openai&logoColor=white)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6.svg?style=for-the-badge)](#-连接到-9router)
[![Proxy](https://img.shields.io/badge/transport-HTTP%20%7C%20SOCKS5-0EA5E9.svg?style=for-the-badge)](#-传输方式)
[![No signup](https://img.shields.io/badge/signup-none-22C55E.svg?style=for-the-badge)](https://ptero.pro)
[![Languages](https://img.shields.io/badge/i18n-5%20languages-F59E0B.svg?style=for-the-badge)](#-语言)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Deutsch](README.de.md)

</div>

---

## ✨ 功能特性

- 🪶 **完全无需注册** —— ptero 身份就是一个由你自己生成的随机 32 位十六进制 token。没有账号、没有邮箱、没有密码、没有验证码。铸造过程离线且即时完成。
- 🔑 **批量铸造 + 验证** —— 身份只有在应答了*真实的*聊天请求之后才会被写入池中，因此池里每一行背后都有实测的 HTTP 200。
- 🔌 **OpenAI 兼容 shim** —— 单个 `http://127.0.0.1:8791/v1` 提供 `deepseek-v4.1-flash` 以及目录中的其余模型，支持 `stream`、`tools`，并可按请求固定身份。
- 🔀 **感知出口的节奏控制** —— 真正的限制是*按出口 IP* 的节流，因此客户端为每个请求预留一个出口并排队，而不是去触发 `429`。
- 🧰 **9Router 连接器** —— 把 shim 注册为一个提供商节点，**每个身份一条连接**，因此每条 9Router 连接就是一个真实的 ptero 身份。
- 🛠 **提升式工具调用** —— 上游没有 `tools` 字段；shim 教模型输出文本形式的工具调用块，再把它还原为真正的 `tool_calls`。
- 🧩 **库或 CLI** —— 在代码中使用 `Ptero`/`VerifiedPool`，或者运行内置的 `ptero-bulk` 命令。
- 🌍 **5 种语言** —— EN、ID、ZH、JA、ES、DE。

## 🚀 快速开始

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

然后像调用任何 OpenAI 端点那样使用：

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}]}'
```

## 🛠 用法

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
| `--count <n>` | 要铸造的身份数量 | `10` |
| `--conc <n>` | 同时进行的验证数量（由出口池控制速率） | `5` |
| `--pool <file>` | 池文件，每行一个身份 | `identities.txt` |
| `--model <id>` | 验证／探测调用使用的模型 | `deepseek-v4.1-flash:free` |
| `--port <n>` | shim 监听端口 | `8791` |
| `--host <addr>` | shim 绑定地址 | `127.0.0.1` |
| `--exits <list>` | 出口列表：`direct,http://host:port,…` | `$PTERO_EXITS` 或 `direct` |
| `--gap <ms>` | 同一出口上两次调用之间的最小间隔 | `2600` |
| `--router <url>` | 9Router 基础 URL | `$N9ROUTER` 或 `http://127.0.0.1:20128` |
| `--router-password <pw>` | 9Router 登录密码 | `$N9ROUTER_PW` 或 `123456` |
| `--shim <url>` | 9Router 节点所指向的 shim 基础 URL | `http://127.0.0.1:8791/v1` |
| `--n <n>` | 连接数（connect）或调用次数（probe） | `16` / `5` |
| `--tools` | 探测时带一个函数工具 | 关 |
| `--dry` | 只显示 `connect` 将要做什么，不做任何改动 | 关 |

环境变量：`PTERO_EXITS`、`PTERO_EXIT_GAP`、`PTERO_KEYS`/`PTERO_BASE`、`N9ROUTER`、`N9ROUTER_PW`、`N9ROUTER_KEY`。

## 🌐 传输方式

ptero 运行时**完全不需要**任何出口 —— 直连就够用，只是在你把流量推上去之后会更早开始限流。`429 Too many messages` 这一次限流是**按出口 IP** 计算的，所以：

- **direct**（默认）—— 单个桶，适合本地 shim 或轻度使用。
- **HTTP / SOCKS5 代理** —— `--exits direct,http://user:pass@host:port,…` 或 `PTERO_EXITS`。走代理的出口需要可选的 `undici` 包；如果它不存在，这些出口会被跳过并给出警告，直连出口仍然照常服务。
- **多个出口** —— 每个出口各自是一个桶。客户端为每个请求预留一个出口，遵守 `--gap`/`PTERO_EXIT_GAP`（默认 2600 ms），遇到 `429` 时只把那个出口停放 20 秒，再在下一个出口上重试。四个出口、2.6 秒的间隔 ≈ 整个舰队 **92 次调用/分钟**。

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

## 🔌 连接到 9Router

9Router 是一个自托管、兼容 OpenAI 的路由器：

```bash
npm install -g 9router && 9router        # dashboard on http://localhost:20128
```

ptero 不使用普通的 HTTP 聊天协议，所以连接器把 9Router 的 `openai-compatible` 节点指向本仓库的 shim，并为**池中每个身份挂一条连接** —— 每条连接的 `Authorization: Bearer <32-hex>` 都会让 shim 把它精确路由到那个身份：

```
node src/connect-9router.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
```

这样会注册出：

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

把任意兼容 OpenAI 的客户端指向它即可：

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🧠 可用模型

模型目录硬编码在 ptero 的站点 bundle 中（上游没有 `/models` 路由），并且可能随时变更。截至 2026-10-17 提供的模型如下：

| 模型                     | 在 9Router 中的调用名              | 备注 |
| ------------------------- | ---------------------------------- | ---- |
| deepseek-v4.1-flash:free  | `ptero/deepseek-v4.1-flash:free`   | ✅ 旗舰模型；已通过 9Router 实测 |
| ling-3.0-flash:free       | `ptero/ling-3.0-flash:free`        | ✅ |
| mistral-nemo:minirouter   | `ptero/mistral-nemo:minirouter`    | ✅ |
| qwen3.7-flash:minirouter  | `ptero/qwen3.7-flash:minirouter`   | ✅ 站点报告的默认模型 |
| apodex-1.1-mini:free      | `ptero/apodex-1.1-mini:free`       | ✅ |

`GET /status` 还会报告哪些 id 是 `disabled` 或处于 `cooldown_models` 中 —— 运行 `ptero-bulk status` 即可看到实时值。短别名（`ptero/deepseek`、`deepseek`、`ling`、`qwen3.7-flash`、……）都会解析到上表中的 id。

## 📚 作为库使用

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

可直接运行的示例：[`examples/mint-and-chat.js`](../examples/mint-and-chat.js)、[`examples/shim-and-router.js`](../examples/shim-and-router.js)。

## ⚙️ 工作原理

ptero.pro 没有注册流程。一个身份就是一个由*你*生成、并作为 `X-MLP-Guest-Token` 发送的 token；除此之外，请求唯一需要的东西就是站点的 WordPress REST nonce。

1. **铸造** —— `crypto.randomUUID().replace(/-/g,'')` → 得到一个 32 位十六进制的 `X-MLP-Guest-Token`（外加一个随机显示名）。即时、离线，无需任何服务器调用。
2. **抓取 nonce** —— `GET https://ptero.pro/` → HTML 中含有 `var nonce = "<10 hex>"`。每个请求都需要以 `X-WP-Nonce` 带上它；它对所有访客通用，每个响应都会回传一个新的，一旦出现 `403 rest_cookie_invalid_nonce` 就必须重新抓取。它从来不会被硬编码。
3. **聊天** —— `POST /wp-json/mlp/v1/chat-stream`，请求体为 `{message, model, conversation_id, attachments, history, lang, mode}` → `200 text/event-stream`，其中包含 `phase · activity · progress · thinking · token · done` 这些事件。`done` 事件带有 `{model_used, usage_tokens, conversation_id}`。
4. **验证** —— 在 `mint` 过程中，身份必须先应答一次真实的聊天请求，然后才会被写入池文件。
5. **提供服务** —— shim 为每个请求挑选一个身份（优先用 bearer 固定的，否则轮询并带 60 秒冷却 + 故障转移），在一个按 `PTERO_EXIT_GAP` 毫秒预留的出口上，然后响应 OpenAI 的 `/v1/chat/completions`。
6. **路由** —— 9Router 的 `ptero` 节点指向该 shim；每个身份一条连接。

其他端点：`/status`（健康状态 + 默认模型）、`/usage`（该身份的 token 桶 —— `max: 1000000`、`reset_seconds: 3600`）、`/api-keys`（访客自己的密钥列表；在全新身份上为空）。

精确的线上格式请见 [`docs/PROTOCOL.md`](../docs/PROTOCOL.md)。

## ⚠️ 说明与限制

- **限制是按出口 IP 算的，不是按身份算的。** 实测：在同一个出口上，调用间隔 0 ms 得到 0/6 OK，1000 ms 得到 2/6，2500 ms 得到 6/6。某个出口正热时，全新的身份会立刻 429；而同一秒、同一模型换一个出口又能返回 200。**身份买到的是韧性；出口买到的是吞吐。** 需要更多次/分钟时，请增加出口而不是身份。按身份的额度确实存在，但相当宽松（1,000,000 tokens/小时）。
- **模型表会过期。** ptero 没有 `/models` 路由；这些 id 都放在站点 bundle 里。如果某个模型返回 404，请重新查看实时 bundle，而不要相信这张表。
- **工具调用只存在于 shim 中。** 上游既没有 `tools` 字段，也没有 `tool_calls` 这个 SSE 帧；shim 教模型输出一个文本块，再把它还原为真正的 `tool_calls` —— 而且只有当你的请求带着 `tools` 时才会这么做。
- **目录中的模型并未逐个验证。** 五个 id 是在同一时间一起提供的；`deepseek-v4.1-flash:free` 是唯一一个反复通过 9Router 实测的模型（12 次按节奏进行的调用，p50 ≈ 2.2 s，p90 ≈ 3.3 s）。
- 池文件含有凭据，尽管这些凭据是匿名的 —— 它已被 git 忽略，而且本仓库不附带任何池文件。
- 仅供个人／教育用途的自动化。请遵守 ptero.pro 与 9Router 的服务条款。

## 📁 目录结构

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

## 📄 许可证

[MIT](../LICENSE) © 2026 ptero-bulk-apikey contributors