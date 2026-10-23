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

**批量铸造 ptero.pro 身份并自动生成 API 密钥 —— 通过本地 shim 实现 OpenAI 兼容推理（deepseek-v4.1-flash 及目录中的其余模型）+ 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-5-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 免费额度 —— 你能获得多少

**ptero.pro 完全无需注册：身份就是你自行生成的随机 32 位十六进制令牌，因此无需付费，也无需注册。**

| 项目 | 值 |
| --- | --- |
| 需要账户 | **无** —— 无需邮箱、密码、验证码或银行卡 |
| 铸造成本 | **零** —— 令牌离线即时生成 |
| 每个身份的配额桶 | **1,000,000 tokens / 小时**（来自 `/usage` 的 `max: 1000000`、`reset_seconds: 3600`） |
| 实际吞吐限制 | **按出口 IP**，而非按身份 —— 见下表 |
| 一个身份能带来什么 | 韧性（冷却 + 故障转移），而非吞吐量 |
| 可扩展的单位 | **出口**，而非身份 → 需要更多调用/分钟时增加出口 |

**在单个出口上实测**（`deepseek-v4.1-flash:free`，调用间隔 → 6 次中成功次数）：

| 间隔 | 结果 |
| --- | --- |
| 0 ms | 0 / 6 成功 |
| 1000 ms | 2 / 6 成功 |
| 2500 ms | 6 / 6 成功 |

四个出口、2.6 秒间隔 ≈ 全集群 **92 次调用/分钟**。

> 💡 免费额度由 ptero.pro 设定，可能发生变化。请在 [ptero.pro](https://ptero.pro) 查看实时数据 —— 并让工具自身的门控来判定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 —— 全部 5 个

该目录硬编码在 ptero 的站点 bundle 中（上游没有 `/models` 路由），且会随时变更。截至 2026-10-17 的提供情况：

| 模型 | 在 9Router 中的调用方式 | 备注 |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ 旗舰模型；通过 9Router 实测（12 次限速调用中 p50 ≈ 2.2 秒，p90 ≈ 3.3 秒） |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ 据报告为站点默认模型 |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` 还会报告哪些 id 处于 `disabled` / `cooldown_models` —— 运行 `ptero-bulk status` 查看实时值。短别名（`ptero/deepseek`、`deepseek`、`ling`、`qwen3.7-flash` 等）都会解析为上述 id。如果某个模型返回 404，请重新检查实时 bundle，而不要轻信此表。

## 🧪 如何使用 API

ptero 上游并不使用纯 HTTP 聊天协议 —— 它在其自有路由上返回 SSE 流。本仓库的 **shim** 将其转换为 **`http://127.0.0.1:8791/v1`** 上的标准 OpenAI 接口：

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

该 shim 支持 `stream`、`tools`（从模型的文本工具调用块中提取为真正的 `tool_calls`）以及按请求固定身份：与池中某身份匹配的 bearer 会路由到该确切身份，否则以 60 秒冷却 + 故障转移进行轮询。

## 🛠 快速开始

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

`identities.txt` 每行保存一个 32 位十六进制身份，且只有真正响应过聊天调用的身份才会被写入其中。

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` 每行保存一个 32 位十六进制身份，且只有真正响应过聊天调用的身份才会被写入其中。
### 🖱️ 启动器

这里没有交互式菜单 —— CLI 就是界面，每个任务都是一条命令（`mint`、`shim`、`connect`、`probe`、`status`、`limit`）。不带任务运行 `node src/cli.js` 会打印 PTERO 横幅和任务列表，每个标志也都有对应的环境变量（`PTERO_EXITS`、`PTERO_EXIT_GAP`、`PTERO_BASE`、`PTERO_HOME`、`PORT`、`N9ROUTER`、`N9ROUTER_PW`、`N9ROUTER_KEY`）。

同一个启动器快捷方式无需写出连接器即可注册池：`node src/launcher.js --connect-9router …` 会把命令行其余部分交给 `src/connect-9router.js`，而 `node src/launcher.js --connect-omniroute …` 会交给 `src/connect-omniroute.js`；两个标志都不带时，它只打印 PTERO 横幅。

## ✅ 已验证可用 —— 每个密钥都经过测试

| 检查项 | 结果 |
| --- | --- |
| 身份铸造 | `crypto.randomUUID().replace(/-/g,'')` → 32 位十六进制的 `X-MLP-Guest-Token`；即时、离线、无服务器调用 |
| nonce 抓取 | `GET https://ptero.pro/` 包含 `var nonce = "<10 hex>"`；`403 rest_cookie_invalid_nonce` 会强制重新抓取，绝不硬编码 |
| 实时验证 | 身份必须真正响应 `POST /wp-json/mlp/v1/chat-stream` 后才会被写入池文件 |
| 通过 9Router | `ptero-bulk probe` —— 在 `deepseek-v4.1-flash:free` 上 12 次限速调用实测 p50 ≈ 2.2 秒，p90 ≈ 3.3 秒 |
| 池文件 | 包含凭据，尽管是匿名的 —— 已被 git 忽略，本仓库不附带任何凭据 |

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro 无需注册。身份是*你*生成并作为 `X-MLP-Guest-Token` 发送的令牌；请求唯一需要的另一项内容是站点的 WordPress REST nonce。

| 步骤 | 调用 | 备注 |
| --- | --- | --- |
| 铸造 | 本地 | `crypto.randomUUID().replace(/-/g,'')` → 32 位十六进制身份 + 随机显示名称 |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`；访客通用，每个响应都会回传一个新的 |
| 聊天 | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream`，事件为 `phase · activity · progress · thinking · token · done`；`done` 携带 `{model_used, usage_tokens, conversation_id}` |
| 验证 | 同一调用 | 身份必须真正响应聊天后才会被写入池 |
| 服务 | 本地 shim | 在预留 `PTERO_EXIT_GAP` 毫秒的出口上按请求选择身份，响应 OpenAI `/v1/chat/completions` |
| 路由 | 9Router | `ptero` 节点指向 shim；每个身份一个连接 |

其他端点：`/status`（健康状态 + 默认模型）、`/usage`（该身份的令牌桶）、`/api-keys`（访客自己的密钥列表；新身份上为空）。确切的传输格式见 [`docs/PROTOCOL.md`](docs/PROTOCOL.md)。

## ⚙️ CLI 选项

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| 标志 | 含义 | 默认值 |
| --- | --- | --- |
| `--count <n>` | 要铸造的身份数量 | `10` |
| `--conc <n>` | 并发验证数（出口池控制速率） | `5` |
| `--pool <file>` | 池文件，每行一个身份 | `identities.txt` |
| `--model <id>` | 验证 / 探测调用使用的模型 | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | shim 监听端口 / 绑定地址 | `8791` / `127.0.0.1` |
| `--exits <list>` | 出口：`direct,http://host:port,…` | `$PTERO_EXITS` 或 `direct` |
| `--gap <ms>` | 同一出口上两次调用之间的最小间隔 | `2600` |
| `--router <url>` / `--router-password <pw>` | 9Router 基础地址 / 登录密码 | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | 9Router 节点指向的 shim 基础 URL | `http://127.0.0.1:8791/v1` |
| `--n <n>` | 连接数（connect）或调用数（probe） | `16` / `5` |
| `--tools` / `--dry` | 使用函数工具探测 / 显示 `connect` 将会做什么 | 关闭 / 关闭 |

环境变量：`PTERO_EXITS`、`PTERO_EXIT_GAP`、`PTERO_BASE`、`PTERO_HOME`、`PORT`、`N9ROUTER`、`N9ROUTER_PW`、`N9ROUTER_KEY`。

## 🛰️ 在代理之后

ptero 运行时**完全不需要**出口 —— 直连即可，只是当你推送流量后会更早开始限速。`429 Too many messages` 限流是**按出口 IP** 的，因此：

- **直连**（默认）—— 单个配额桶，适合本地 shim 或轻度使用。
- **HTTP / SOCKS5 代理** —— `--exits direct,http://user:pass@host:port,…` 或 `PTERO_EXITS`。代理出口需要可选的 `undici` 包；如果缺失，这些出口会被跳过并给出警告，直连出口仍可服务。
- **多个出口** —— 每个出口是独立的配额桶。客户端为每个请求预留一个出口，遵守 `--gap` / `PTERO_EXIT_GAP`（默认 2600 毫秒），遇到 `429` 时仅将该出口暂停 20 秒并在下一个出口上重试。

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**身份带来韧性；出口带来吞吐量。** 一个全新的身份在某个出口繁忙时会立即收到 429，而同一秒同一模型通过另一个出口却能返回 200。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `identities.txt` | 每行一个已验证的 32 位十六进制身份 —— 已被 git 忽略（凭据，尽管是匿名的） |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | 基于已验证池的 OpenAI 兼容 `/v1` |
| `src/connect-9router.js` | 提供者节点 + 每个身份一个连接 |
| `src/lib/` | `ptero.js`（nonce 抓取、SSE chat-stream）、`identity.js`、`pool.js`、`exits.js`、`tools.js`、`models.js` |
| `docs/PROTOCOL.md` | ptero.pro 传输格式，逐步说明 |
| `examples/` | `mint-and-chat.js`、`shim-and-router.js` |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、OpenAI 兼容的路由器（`npm install -g 9router && 9router`，仪表盘位于 `http://localhost:20128`）。

ptero 不使用纯 HTTP 聊天协议，因此连接器将 9Router 的 `openai-compatible` 节点指向本仓库的 **shim**，并附加**每个池身份一个连接** —— 每个连接的 `Authorization: Bearer <32-hex>` 使 shim 将其路由到该确切身份：

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

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管、OpenAI 兼容的路由器（`npm install -g omniroute && omniroute`，仪表盘位于 `http://localhost:20128`）。

ptero 不使用纯 HTTP 聊天协议，因此连接器将 OmniRoute 的 `openai-compatible` 节点指向本仓库的 **shim**，并附加**每个池身份一个连接** —— 每个连接的 `Authorization: Bearer <32-hex>` 使 shim 将其路由到该确切身份：

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

## 🔑 一个密钥能带来什么

| | |
| --- | --- |
| 🏢 提供者 | **ptero.pro** —— [ptero.pro](https://ptero.pro) |
| 🎁 提供者提供什么 | 无需注册、无需邮箱、无需验证码 —— 每个身份每小时 1,000,000 tokens，吞吐量由你的出口决定 |
| 🔑 一个密钥能带来什么 | 一个 API 密钥，作用域为其自身账户：下方端点上的 5 个模型 id，按你的套餐限制。配额存在于**账户**上，这正是本工具为每个密钥创建一个账户的原因 |
| 🌐 API 形态 | OpenAI 兼容：`POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 你的数据 | 仅联系 ptero.pro 和你配置的收件箱后端；密钥保留在你的机器上 |

## 🐞 问题反馈

如果 ptero.pro 更改了 nonce 形态、chat-stream 路由或模型 id，工具会在该步骤停止并说明原因。请**[提交 issue](../../issues)**，附上你运行的命令和确切输出；欢迎 PR。

## 📄 许可证

MIT © 2026 —— 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>