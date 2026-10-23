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

**自動生成された API キーで ptero.pro のアイデンティティを一括発行 — ローカル shim 経由の OpenAI 互換推論（deepseek-v4.1-flash およびカタログの残り）+ 9Router コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-5-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 イシュー](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 無料枠 — どれだけ使えるか

**ptero.pro には登録が一切ありません。アイデンティティとは自分で生成するランダムな 32 桁の 16 進トークンであり、支払うものもサインアップするものも何もありません。**

| 項目 | 値 |
| --- | --- |
| 必要なアカウント | **なし** — メールもパスワードもキャプチャもカードも不要 |
| 発行コスト | **ゼロ** — トークンはオフラインで即座に生成される |
| アイデンティティごとのバケット | **1,000,000 トークン / 時間**（`/usage` より `max: 1000000`、`reset_seconds: 3600`） |
| 実際のスループット制限 | **アイデンティティ単位ではなく送信元 IP 単位** — 下の表を参照 |
| 1 つのアイデンティティで得られるもの | スループットではなく耐障害性（クールダウン + フェイルオーバー） |
| スケールする単位 | **アイデンティティではなく出口（exit）** → 呼び出し回数/分を増やすには出口を追加する |

**1 つの出口での実測値**（`deepseek-v4.1-flash:free`、呼び出し間隔 → 6 回中の成功数）:

| 間隔 | 結果 |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

2.6 秒間隔で 4 つの出口を使うと、フリート全体でおよそ **92 呼び出し/分**。

> 💡 無料枠は ptero.pro が設定するもので、変更される可能性があります。最新の数値は [ptero.pro](https://ptero.pro) で確認してください — そしてツール自身のゲートに判断を委ねましょう:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 全 5 種類

カタログは ptero のサイトバンドルにハードコードされており（上流に `/models` ルートは存在しません）、予告なく変更されます。2026-10-17 時点で提供されているもの:

| モデル | 9Router での呼び出し方 | 備考 |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ 主力モデル。9Router 経由で実測（12 回の間隔を空けた呼び出しで p50 ≈ 2.2 秒、p90 ≈ 3.3 秒） |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ サイトのデフォルトとして報告されている |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` はどの id が `disabled` / `cooldown_models` にあるかも報告します — `ptero-bulk status` を実行して最新の値を確認してください。短いエイリアス（`ptero/deepseek`、`deepseek`、`ling`、`qwen3.7-flash`、…）はすべて上記の id に解決されます。モデルが 404 を返す場合は、この表を信じるのではなく、ライブバンドルを再確認してください。

## 🧪 API の使い方

ptero は上流でプレーンな HTTP チャットを話しません — 独自のルートで SSE ストリームを返します。このリポジトリの **shim** がそれを **`http://127.0.0.1:8791/v1`** 上の通常の OpenAI サーフェスに変換します:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

shim は `stream`、`tools`（モデルのテキストによるツール呼び出しブロックから実際の `tool_calls` へ持ち上げる）、およびリクエストごとのアイデンティティ固定をサポートします。プール内のアイデンティティに一致するベアラーはその正確なアイデンティティにルーティングされ、それ以外は 60 秒のクールダウン + フェイルオーバー付きでラウンドロビンされます。

## 🛠 クイックスタート

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

`identities.txt` は 1 行につき 1 つの 32 桁の 16 進アイデンティティを保持し、実際のチャット呼び出しに応答したアイデンティティのみが書き込まれます。

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` は 1 行につき 1 つの 32 桁の 16 進アイデンティティを保持し、実際のチャット呼び出しに応答したアイデンティティのみが書き込まれます。
### 🖱️ ランチャー

ここには対話型メニューはありません — CLI がインターフェースであり、すべてのタスクは 1 つのコマンドです（`mint`、`shim`、`connect`、`probe`、`status`、`limit`）。タスクを指定せずに `node src/cli.js` を実行すると PTERO バナーとタスク一覧が表示され、すべてのフラグには環境変数も用意されています（`PTERO_EXITS`、`PTERO_EXIT_GAP`、`PTERO_BASE`、`PTERO_HOME`、`PORT`、`N9ROUTER`、`N9ROUTER_PW`、`N9ROUTER_KEY`）。

同じランチャーのショートカットで、コネクタを明示せずにプールを登録できます: `node src/launcher.js --connect-9router …` は残りのコマンドラインを `src/connect-9router.js` に渡し、`node src/launcher.js --connect-omniroute …` は `src/connect-omniroute.js` に渡します。どちらのフラグもない場合は PTERO バナーを表示するだけです。

## ✅ 検証済み — すべてのキーがテストされています

| チェック | 結果 |
| --- | --- |
| アイデンティティ発行 | `crypto.randomUUID().replace(/-/g,'')` → 32 桁の 16 進 `X-MLP-Guest-Token`。即座、オフライン、サーバー呼び出しなし |
| nonce スクレイプ | `GET https://ptero.pro/` に `var nonce = "<10 hex>"` が含まれる。`403 rest_cookie_invalid_nonce` は再スクレイプを強制し、ハードコードされることは決してない |
| ライブ証明 | プールファイルに書き込まれる前に、アイデンティティが実際の `POST /wp-json/mlp/v1/chat-stream` に応答しなければならない |
| 9Router 経由 | `ptero-bulk probe` — `deepseek-v4.1-flash:free` で 12 回の間隔を空けた呼び出しで p50 ≈ 2.2 秒、p90 ≈ 3.3 秒を実測 |
| プールファイル | 匿名であれ認証情報を含む — git で無視され、このリポジトリには一切含まれない |

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro には登録がありません。アイデンティティとは *あなた* が生成し `X-MLP-Guest-Token` として送信するトークンです。リクエストに必要なもう 1 つは、サイトの WordPress REST nonce だけです。

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| mint | ローカル | `crypto.randomUUID().replace(/-/g,'')` → 32 桁の 16 進アイデンティティ + ランダムな表示名 |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`。ゲスト全体で共通で、すべてのレスポンスが新しいものを返す |
| chat | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream`、イベントは `phase · activity · progress · thinking · token · done`。`done` は `{model_used, usage_tokens, conversation_id}` を運ぶ |
| verify | 同じ呼び出し | プールに書き込まれる前に、アイデンティティが実際のチャットに応答しなければならない |
| serve | ローカル shim | `PTERO_EXIT_GAP` ms のために予約された出口でリクエストごとにアイデンティティを選び、OpenAI `/v1/chat/completions` に応答する |
| route | 9Router | `ptero` ノードが shim を指す。アイデンティティごとに 1 つの接続 |

その他のエンドポイント: `/status`（ヘルス + デフォルトモデル）、`/usage`（アイデンティティのトークンバケット）、`/api-keys`（ゲスト自身のキー一覧。新しいアイデンティティでは空）。正確なワイヤフォーマットは [`docs/PROTOCOL.md`](docs/PROTOCOL.md) にあります。

## ⚙️ CLI オプション

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| フラグ | 意味 | デフォルト |
| --- | --- | --- |
| `--count <n>` | 発行するアイデンティティ数 | `10` |
| `--conc <n>` | 同時実行する検証数（出口プールがレートを調整する） | `5` |
| `--pool <file>` | プールファイル、1 行につき 1 アイデンティティ | `identities.txt` |
| `--model <id>` | 検証 / probe 呼び出しが使用するモデル | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | shim のリッスンポート / バインドアドレス | `8791` / `127.0.0.1` |
| `--exits <list>` | 送信出口: `direct,http://host:port,…` | `$PTERO_EXITS` または `direct` |
| `--gap <ms>` | 1 つの出口での 2 回の呼び出し間の最小間隔 | `2600` |
| `--router <url>` / `--router-password <pw>` | 9Router のベース / ログインパスワード | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | 9Router ノードが指す shim のベース URL | `http://127.0.0.1:8791/v1` |
| `--n <n>` | 接続数（connect）または呼び出し数（probe） | `16` / `5` |
| `--tools` / `--dry` | 関数ツール付きで probe / `connect` が何をするか表示 | off / off |

環境変数: `PTERO_EXITS`、`PTERO_EXIT_GAP`、`PTERO_BASE`、`PTERO_HOME`、`PORT`、`N9ROUTER`、`N9ROUTER_PW`、`N9ROUTER_KEY`。

## 🛰️ プロキシの背後で

ptero は動作するのに出口が **一切** 必要ありません — 直接接続で問題ありませんが、トラフィックを流し始めるとすぐにレート制限がかかり始めます。`429 Too many messages` スロットルは **送信元 IP 単位** なので:

- **direct**（デフォルト） — 1 つのバケット。ローカル shim や軽い使用には十分。
- **HTTP / SOCKS5 プロキシ** — `--exits direct,http://user:pass@host:port,…` または `PTERO_EXITS`。プロキシ経由の出口にはオプションの `undici` パッケージが必要です。存在しない場合、それらの出口は警告付きでスキップされ、direct 出口は引き続き機能します。
- **複数の出口** — 各出口は独自のバケットです。クライアントはリクエストごとに 1 つの出口を予約し、`--gap` / `PTERO_EXIT_GAP`（デフォルト 2600 ms）を守り、`429` の場合はその出口のみを 20 秒間停止して次で再試行します。

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**アイデンティティは耐障害性を、出口はスループットを買います。** 真新しいアイデンティティは出口が熱い間は即座に 429 を返し、同じ秒に同じモデルが別の出口では 200 を返します。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `identities.txt` | 検証済みの 32 桁の 16 進アイデンティティを 1 行に 1 つ — git で無視（匿名であれ認証情報） |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | 検証済みプール上の OpenAI 互換 `/v1` |
| `src/connect-9router.js` | プロバイダーノード + アイデンティティごとに 1 つの接続 |
| `src/lib/` | `ptero.js`（nonce スクレイプ、SSE chat-stream）、`identity.js`、`pool.js`、`exits.js`、`tools.js`、`models.js` |
| `docs/PROTOCOL.md` | ptero.pro のワイヤフォーマット、ステップバイステップ |
| `examples/` | `mint-and-chat.js`、`shim-and-router.js` |

## 🔌 9Router に接続する

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです（`npm install -g 9router && 9router`、ダッシュボードは `http://localhost:20128`）。

ptero はプレーンな HTTP チャットを話さないため、コネクタは 9Router の `openai-compatible` ノードをこのリポジトリの **shim** に向け、**プール内のアイデンティティごとに 1 つの接続** をアタッチします — 各接続の `Authorization: Bearer <32-hex>` により、shim はそれをその正確なアイデンティティにルーティングします:

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

## 🔌 OmniRoute に接続する

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです（`npm install -g omniroute && omniroute`、ダッシュボードは `http://localhost:20128`）。

ptero はプレーンな HTTP チャットを話さないため、コネクタは OmniRoute の `openai-compatible` ノードをこのリポジトリの **shim** に向け、**プール内のアイデンティティごとに 1 つの接続** をアタッチします — 各接続の `Authorization: Bearer <32-hex>` により、shim はそれをその正確なアイデンティティにルーティングします:

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

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 プロバイダーが提供するもの | サインアップ不要、メール不要、キャプチャ不要 — アイデンティティごとに 1,000,000 トークン/時間、スループットは出口によって決まる |
| 🔑 1 つのキーで得られるもの | 独自のアカウントにスコープされた 1 つの API キー: 下記エンドポイントの 5 つのモデル id を、プランの制限内で。クォータは **アカウント** に存在するため、このツールがキーごとに 1 つのアカウントを作成するのです |
| 🌐 API の形 | OpenAI 互換: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 あなたのデータ | 接触するのは ptero.pro と設定した inbox バックエンドのみ。キーはあなたのマシンに留まります |

## 🐞 イシュー

ptero.pro が nonce の形、chat-stream ルート、またはモデル id を変更した場合、ツールはそのステップで停止し、その旨を報告します。実行したコマンドと正確な出力を添えて **[イシューを開いてください](../../issues)**。PR も歓迎します。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>