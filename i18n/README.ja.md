<div align="center">

```
██████╗  ████████╗ ███████╗ ██████╗   ██████╗
██╔══██╗ ╚══██╔══╝ ██╔════╝ ██╔══██╗ ██╔═══██╗
██████╔╝    ██║    █████╗   ██████╔╝ ██║   ██║
██╔═══╝     ██║    ██╔══╝   ██╔══██╗ ██║   ██║
██║         ██║    ███████╗ ██║  ██║ ╚██████╔╝
╚═╝         ╚═╝    ╚══════╝ ╚═╝  ╚═╝  ╚═════╝
```
<img src="../brand/logo.svg" alt="ptero-bulk" width="150" />

# ptero-bulk-apikey

**[ptero.pro](https://ptero.pro) の ID をまとめて生成 — 登録もメールも CAPTCHA も不要 — さらに `deepseek-v4.1-flash` をローカルの OpenAI 互換 shim で配信し、起動中の [9Router](https://9router.com) インスタンスへ登録します。必須依存関係ゼロ。**

[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/required%20deps-0-blue.svg?style=for-the-badge)](#)
[![OpenAI compatible](https://img.shields.io/badge/API-OpenAI--compatible-412991.svg?style=for-the-badge&logo=openai&logoColor=white)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6.svg?style=for-the-badge)](#-9router-への接続)
[![Proxy](https://img.shields.io/badge/transport-HTTP%20%7C%20SOCKS5-0EA5E9.svg?style=for-the-badge)](#-トランスポート)
[![No signup](https://img.shields.io/badge/signup-none-22C55E.svg?style=for-the-badge)](https://ptero.pro)
[![Languages](https://img.shields.io/badge/i18n-5%20languages-F59E0B.svg?style=for-the-badge)](#)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Deutsch](README.de.md)

</div>

---

## ✨ 特長

- 🪶 **登録そのものが一切不要** — ptero の ID は自分で生成する 32 桁 hex のランダムトークンです。アカウントも、メールも、パスワードも、CAPTCHA も要りません。生成はオフラインで瞬時に完了します。
- 🔑 **一括生成と検証** — ID は*実際の*チャットリクエストに応答できたあとにだけプールへ書き込まれるため、プールの 1 行 1 行に実測の HTTP 200 が付いています。
- 🔌 **OpenAI 互換 shim** — 単一の `http://127.0.0.1:8791/v1` が `deepseek-v4.1-flash` とカタログの残りも配信し、`stream`、`tools`、リクエストごとの ID 固定に対応します。
- 🔀 **出口を意識したペース制御** — 本当の制限は*送信元 IP ごと*のスロットルなので、クライアントはリクエストごとに出口を 1 つ確保し、`429` を踏む代わりにキューへ回します。
- 🧰 **9Router コネクタ** — shim をプロバイダノードとして登録し、**ID ごとに 1 接続**とします。つまり 9Router の 1 接続は実在の ptero ID 1 つに対応します。
- 🛠 **ツール呼び出しの持ち上げ** — 上流には `tools` フィールドがありません。shim はモデルにテキストのツールコールブロックを教え、それを本物の `tool_calls` へ持ち上げます。
- 🧩 **ライブラリまたは CLI** — コード内で `Ptero`／`VerifiedPool` を使うか、同梱の `ptero-bulk` コマンドを実行します。
- 🌍 **5 言語** — EN, ID, ZH, JA, ES, DE。

## 🚀 クイックスタート

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

あとは通常の OpenAI エンドポイントと同じように呼べます:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}]}'
```


# 3. register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

あとは通常の OpenAI エンドポイントと同じように呼べます:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<omniroute key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}]}'
```
## 🛠 使い方

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                  # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                          # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                    # prove the throttle is per exit, not per identity
```

| フラグ | 説明 | 既定値 |
| --- | --- | --- |
| `--count <n>` | 生成する ID の数 | `10` |
| `--conc <n>` | 同時に走らせる検証の数（レートは出口プールが調整します） | `5` |
| `--pool <file>` | プールファイル、1 行につき ID を 1 つ | `identities.txt` |
| `--model <id>` | 検証／probe の呼び出しで使うモデル | `deepseek-v4.1-flash:free` |
| `--port <n>` | shim の待ち受けポート | `8791` |
| `--host <addr>` | shim のバインドアドレス | `127.0.0.1` |
| `--exits <list>` | 送信元出口: `direct,http://host:port,…` | `$PTERO_EXITS` または `direct` |
| `--gap <ms>` | 同じ出口で 2 回の呼び出しを行う間の最小間隔 | `2600` |
| `--router <url>` | 9Router のベース URL | `$N9ROUTER` または `http://127.0.0.1:20128` |
| `--router-password <pw>` | 9Router のログインパスワード | `$N9ROUTER_PW` または `123456` |
| `--shim <url>` | 9Router ノードが指す shim のベース URL | `http://127.0.0.1:8791/v1` |
| `--n <n>` | 接続数（connect）または呼び出し数（probe） | `16` / `5` |
| `--tools` | 関数を tool として probe する | オフ |
| `--dry` | `connect` が行うことを表示するだけで、何も変更しない | オフ |

環境変数: `PTERO_EXITS`、`PTERO_EXIT_GAP`、`PTERO_BASE`、`PTERO_HOME`、`PORT`、`N9ROUTER`、`N9ROUTER_PW`、`N9ROUTER_KEY`。

## 🌐 トランスポート

ptero の動作に出口は**まったく**必要ありません — 直接接続で十分であり、トラフィックを増やした時点からレート制限が働き始めるだけです。`429 Too many messages` のスロットルは**送信元 IP ごと**なので:

- **direct**（既定）— バケットは 1 つ。ローカル shim や軽めの利用には足ります。
- **HTTP / SOCKS5 プロキシ** — `--exits direct,http://user:pass@host:port,…` または `PTERO_EXITS`。プロキシ経由の出口には任意の `undici` パッケージが必要で、無ければその出口は警告とともにスキップされ、direct の出口が引き続き応答します。
- **複数の出口** — 出口はそれぞれ独自のバケットです。クライアントはリクエストごとに出口を 1 つ確保し、`--gap`／`PTERO_EXIT_GAP`（既定 2600 ms）を守り、`429` が返ったときはその出口だけを 20 秒休ませて次の出口で再試行します。2.6 秒間隔の 4 出口で、全体で **1 分あたり 92 呼び出し**になります。

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

## 🔌 9Router への接続

9Router はセルフホスト型の OpenAI 互換ルーターです:

```bash
npm install -g 9router && 9router        # dashboard on http://localhost:20128
```

ptero は素の HTTP チャットを話せないため、コネクタは 9Router の `openai-compatible` ノードをこのリポジトリの shim へ向けるとともに、**プール内の ID につき 1 接続**を割り当てます — 各接続の `Authorization: Bearer <32-hex>` によって、shim はその要求をまさにその ID へルーティングします:

```
node src/connect-9router.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
```

次のように登録されます:

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

任意の OpenAI 互換クライアントを向ければ、そのまま使えます:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🧠 利用可能なモデル

カタログは ptero のサイトバンドルにハードコードされており（上游に `/models` ルートはありません）、予告なく変わります。2026-10-17 時点の配信状況:

| モデル                    | 9Router での呼び出し名            | 注記 |
| ------------------------- | --------------------------------- | ---- |
| deepseek-v4.1-flash:free  | `ptero/deepseek-v4.1-flash:free`  | ✅ 主力。9Router 経由で実測済み |
| ling-3.0-flash:free       | `ptero/ling-3.0-flash:free`       | ✅ |
| mistral-nemo:minirouter   | `ptero/mistral-nemo:minirouter`   | ✅ |
| qwen3.7-flash:minirouter  | `ptero/qwen3.7-flash:minirouter`  | ✅ サイトの既定として報告あり |
| apodex-1.1-mini:free      | `ptero/apodex-1.1-mini:free`      | ✅ |

`GET /status` は、どの ID が `disabled` か、どの ID が `cooldown_models` に入っているかも報告します — 現在の値を見るには `ptero-bulk status` を実行してください。短いエイリアス（`ptero/deepseek`、`deepseek`、`ling`、`qwen3.7-flash`、…）は、いずれも上の ID へ解決されます。

## 📚 ライブラリとして使う

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

そのまま実行できるサンプル: [`examples/mint-and-chat.js`](../examples/mint-and-chat.js)、[`examples/shim-and-router.js`](../examples/shim-and-router.js)。

## ⚙️ 仕組み

ptero.pro には登録がありません。ID は*自分*が生成して `X-MLP-Guest-Token` として送るトークンです。リクエストに必要な他のものは、サイトの WordPress REST nonce だけです。

1. **生成** — `crypto.randomUUID().replace(/-/g,'')` → 32 桁 hex の `X-MLP-Guest-Token`（加えてランダムな表示名）。瞬時に、オフラインで、サーバー呼び出しなし。
2. **nonce の取得** — `GET https://ptero.pro/` → HTML に `var nonce = "<10 hex>"` が含まれます。すべてのリクエストはこれを `X-WP-Nonce` として必要とします。ゲスト全体で共通で、レスポンスごとに新しい値が返り、`403 rest_cookie_invalid_nonce` が出たら取得し直します。ハードコードされることはありません。
3. **チャット** — `POST /wp-json/mlp/v1/chat-stream` に `{message, model, conversation_id, attachments, history, lang, mode}` を渡すと、`200 text/event-stream` と `phase · activity · progress · thinking · token · done` のイベントが得られます。`done` イベントは `{model_used, usage_tokens, conversation_id}` を持ちます。
4. **検証** — `mint` の最中、ID はプールファイルへ書き込まれる前に実際のリクエストに応答しなければなりません。
5. **配信** — shim はリクエストごとに ID を選び（bearer で固定されていなければ 60 秒のクールダウンとフェイルオーバーを伴うラウンドロビン）、`PTERO_EXIT_GAP` ms 用に確保した出口を使い、OpenAI の `/v1/chat/completions` に応答します。
6. **ルーティング** — 9Router の `ptero` ノードが shim を向き、ID ごとに 1 接続です。

その他のエンドポイント: `/status`（ヘルスと既定モデル）、`/usage`（その ID のトークンバケット — `max: 1000000`、`reset_seconds: 3600`）、`/api-keys`（ゲスト自身のキーリスト。新規の ID では空）。

正確なワイヤーフォーマットは [`docs/PROTOCOL.md`](../docs/PROTOCOL.md) を参照してください。

## ⚠️ 注意と制限

- **制限は ID ごとではなく、送信元 IP ごとです。** 実測: 1 つの出口で呼び出し間隔 0 ms だと 0/6 が OK、1000 ms だと 2/6、2500 ms だと 6/6。使い捨ての新規 ID は、出口が熱い間は即座に 429 になり、同じ秒でも別の出口経由なら同じモデルが 200 を返します。**ID はレジリエンスを買います。出口はスループットを買います。** 1 分あたりの呼び出しを増やしたいときは、ID ではなく出口を追加してください。ID ごとのバケットも実在しますが、余裕は大きいです（1,000,000 トークン／時間）。
- **モデル表は古びます。** ptero には `/models` ルートが無く、ID はサイトバンドルの中にあります。モデルが 404 になったときは、この表を信じるより現在のバンドルを確認してください。
- **ツール呼び出しは shim にのみ存在します。** 上流には `tools` フィールドも `tool_calls` の SSE フレームもありません。shim はモデルにテキストブロックを教え、それを本物の `tool_calls` へ持ち上げます — しかも、リクエストが `tools` を含んでいるときに限ります。
- **カタログはモデルごとの検証がされていません。** 5 つの ID は同時に配信されていました。9Router 経由で繰り返し実測されているのは `deepseek-v4.1-flash:free` だけです（12 回のペース調整済み呼び出しで p50 ≈ 2.2 秒、p90 ≈ 3.3 秒）。
- プールファイルは匿名ではあるものの認証情報を含みます — `.gitignore` 済みであり、このリポジトリはどれも同梱していません。
- 個人／教育目的の自動化用。ptero.pro と 9Router の利用規約を尊重してください。

## 📁 ディレクトリ構成

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

## 📄 ライセンス

[MIT](../LICENSE) © 2026 ptero-bulk-apikey contributors