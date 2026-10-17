<div align="center">
<img src="../brand/logo.svg" alt="ptero-bulk" width="150" />

# ptero-bulk-apikey

**Buat identitas [ptero.pro](https://ptero.pro) secara massal — tanpa pendaftaran, tanpa surel, tanpa captcha — dan sajikan `deepseek-v4.1-flash` melalui shim OpenAI-compatible lokal, terdaftar di instance [9Router](https://9router.com) yang sedang berjalan. Tanpa dependensi wajib.**

[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/required%20deps-0-blue.svg?style=for-the-badge)](#)
[![OpenAI compatible](https://img.shields.io/badge/API-OpenAI--compatible-412991.svg?style=for-the-badge&logo=openai&logoColor=white)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6.svg?style=for-the-badge)](#-sambungkan-ke-9router)
[![Proxy](https://img.shields.io/badge/transport-HTTP%20%7C%20SOCKS5-0EA5E9.svg?style=for-the-badge)](#-transport)
[![No signup](https://img.shields.io/badge/signup-none-22C55E.svg?style=for-the-badge)](https://ptero.pro)
[![Languages](https://img.shields.io/badge/i18n-5%20languages-F59E0B.svg?style=for-the-badge)](#-bahasa)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Deutsch](README.de.md)

</div>

---

## ✨ Fitur

- 🪶 **Tanpa pendaftaran sama sekali** — identitas ptero adalah token 32-hex acak yang Anda buat sendiri. Tidak ada akun, surel, kata sandi, atau captcha. Pembuatan identitas dilakukan offline dan instan.
- 🔑 **Pembuatan massal + verifikasi** — identitas baru ditulis ke pool setelah menjawab permintaan *chat* sungguhan, jadi setiap baris di pool punya HTTP 200 terukur.
- 🔌 **Shim OpenAI-compatible** — satu `http://127.0.0.1:8791/v1` menyajikan `deepseek-v4.1-flash` beserta katalog lainnya, dengan `stream`, `tools`, dan pemetaan identitas per permintaan.
- 🔀 **Pacing sadar-exit** — batas sebenarnya adalah throttle *per IP keluar*, jadi klien memesan satu exit untuk tiap permintaan dan mengantre alih-alih memicu `429`.
- 🧰 **Konektor 9Router** — mendaftarkan shim sebagai node penyedia dengan **satu koneksi per identitas**, sehingga setiap koneksi 9Router adalah satu identitas ptero sungguhan.
- 🛠 **Tool calling yang diangkat** — hulu tidak punya bidang `tools`; shim mengajarkan blok tool-call berupa teks lalu mengembalikannya menjadi `tool_calls` sungguhan.
- 🧩 **Library atau CLI** — pakai `Ptero`/`VerifiedPool` di kode, atau jalankan perintah `ptero-bulk`.
- 🌍 **5 bahasa** — EN, ID, ZH, JA, ES, DE.

## 🚀 Mulai cepat

```bash
git clone https://github.com/F0Rextasy/ptero-bulk-apikey
cd ptero-bulk-apikey

# 1. buat 50 identitas (tiap satu diverifikasi lewat panggilan deepseek-v4.1-flash sungguhan)
node src/cli.js mint --count 50 --conc 8

# 2. sajikan sebagai OpenAI
node src/cli.js shim --pool identities.txt --port 8791

# 3. daftarkan pool ke 9Router yang sedang berjalan
node src/cli.js connect --n 16
```

Lalu panggil seperti endpoint OpenAI biasa:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}]}'
```

## 🛠 Penggunaan

```bash
ptero-bulk mint --count 250 --conc 16       # pembuatan massal + verifikasi ke identities.txt
ptero-bulk shim --pool identities.txt       # /v1 OpenAI-compatible di :8791
ptero-bulk connect --n 16                  # daftar ke 9Router (satu koneksi per identitas)
ptero-bulk probe --n 5 --gap 3000           # panggilan end-to-end lewat 9Router
ptero-bulk status                          # /status hulu + /usage identitas baru
ptero-bulk limit --k 12                    # buktikan throttle ada di exit, bukan di identitas
```

| Flag | Deskripsi | Default |
| --- | --- | --- |
| `--count <n>` | jumlah identitas yang dibuat | `10` |
| `--conc <n>` | verifikasi yang berjalan bersamaan (pool exit yang mengatur laju) | `5` |
| `--pool <file>` | berkas pool, satu identitas per baris | `identities.txt` |
| `--model <id>` | model untuk verifikasi / probe | `deepseek-v4.1-flash:free` |
| `--port <n>` | port dengar shim | `8791` |
| `--host <addr>` | alamat ikat shim | `127.0.0.1` |
| `--exits <list>` | exit keluar: `direct,http://host:port,…` | `$PTERO_EXITS` atau `direct` |
| `--gap <ms>` | jeda minimum dua panggilan pada satu exit | `2600` |
| `--router <url>` | URL dasar 9Router | `$N9ROUTER` atau `http://127.0.0.1:20128` |
| `--router-password <pw>` | kata sandi masuk 9Router | `$N9ROUTER_PW` atau `123456` |
| `--shim <url>` | URL dasar shim yang ditunjuk node 9Router | `http://127.0.0.1:8791/v1` |
| `--n <n>` | koneksi (connect) atau panggilan (probe) | `16` / `5` |
| `--tools` | probe dengan fungsi tool | mati |
| `--dry` | tampilkan yang akan dilakukan `connect`, tanpa mengubah apa pun | mati |

Environment: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🌐 Transport

ptero **tidak** butuh exit apa pun agar bisa bekerja — koneksi langsung sudah cukup, hanya mulai lebih cepat membatasi laju saat lalu lintas menumpuk. Throttle `429 Too many messages` bersifat **per IP keluar**, jadi:

- **direct** (default) — satu ember, cukup untuk shim lokal atau pemakaian ringan.
- **proxy HTTP / SOCKS5** — `--exits direct,http://user:pass@host:port,…` atau `PTERO_EXITS`. Exit via proxy butuh paket opsional `undici`; bila tidak ada, exit tersebut dilewati dengan peringatan dan exit direct tetap melayani.
- **Beberapa exit** — tiap exit adalah ember sendiri. Klien mewadahi satu exit per permintaan, menghormati `--gap`/`PTERO_EXIT_GAP` (2600 ms default), dan saat `429` hanya memarkir exit itu selama 20 detik lalu mencoba lagi di exit berikutnya. Empat exit dengan jeda 2,6 detik ≈ **92 panggilan/menit** untuk seluruh armada.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

## 🔌 Sambungkan ke 9Router

9Router adalah router OpenAI-compatible yang di-hosting sendiri:

```bash
npm install -g 9router && 9router        # dasbor di http://localhost:20128
```

ptero tidak berbicara chat HTTP biasa, jadi konektor mengarahkan node `openai-compatible` 9Router ke shim repo ini dan memasang **satu koneksi per identitas pool** — `Authorization: Bearer <32-hex>` pada tiap koneksi membuat shim meneruskannya ke identitas itu secara persis:

```
node src/connect-9router.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
```

Yang terdaftar:

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

Arahkan klien OpenAI-compatible apa pun ke sana:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🧠 Model yang tersedia

Katalognya ditulis langsung di bundel situs ptero (tidak ada rute `/models` di hulu) dan berubah sewaktu-waktu. Kondisi per 2026-10-17:

| Model                     | Panggil di 9Router                 | Catatan |
| ------------------------- | ---------------------------------- | ------- |
| deepseek-v4.1-flash:free  | `ptero/deepseek-v4.1-flash:free`   | ✅ flagship; terukur lewat 9Router |
| ling-3.0-flash:free       | `ptero/ling-3.0-flash:free`        | ✅ |
| mistral-nemo:minirouter   | `ptero/mistral-nemo:minirouter`    | ✅ |
| qwen3.7-flash:minirouter  | `ptero/qwen3.7-flash:minirouter`   | ✅ dilaporkan sebagai default situs |
| apodex-1.1-mini:free      | `ptero/apodex-1.1-mini:free`       | ✅ |

`GET /status` juga melaporkan id mana yang `disabled` atau ada di `cooldown_models` — jalankan `ptero-bulk status` untuk melihat nilai langsungnya. Alias pendek (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) semuanya meneruskan ke id di atas.

## 📚 Sebagai library

```js
const { Ptero } = require('ptero-bulk-apikey/src/lib/ptero.js');
const { mintIdentities, VerifiedPool } = require('ptero-bulk-apikey/src/lib/pool.js');

// satu identitas, satu chat — tanpa pool
const client = new Ptero();
const { text, meta } = await client.chat('Reply with the single word: ok', {
  model: 'deepseek-v4.1-flash:free',
});
console.log(text, meta.model_used);

// atau pool terverifikasi dengan failover
await mintIdentities({ count: 10, conc: 4, outFile: 'identities.txt' });
const pool = new VerifiedPool('identities.txt');
const out = await pool.chat({ message: 'hi', model: 'deepseek-v4.1-flash:free' });
console.log(out.identity, out.meta.model_used);
```

Contoh yang bisa dijalankan: [`examples/mint-and-chat.js`](../examples/mint-and-chat.js), [`examples/shim-and-router.js`](../examples/shim-and-router.js).

## ⚙️ Cara kerjanya

ptero.pro tidak punya pendaftaran. Identitas adalah token yang *Anda* buat dan kirim sebagai `X-MLP-Guest-Token`; satu-satunya hal lain yang dibutuhkan permintaan itu adalah nonce REST WordPress milik situs.

1. **Buat** — `crypto.randomUUID().replace(/-/g,'')` → `X-MLP-Guest-Token` 32-hex (sekaligus nama tampilan acak). Instan, offline, tanpa panggilan server.
2. **Ambil nonce** — `GET https://ptero.pro/` → HTML memuat `var nonce = "<10 hex>"`. Setiap permintaan membutuhkannya sebagai `X-WP-Nonce`; nonce berlaku lintas identitas, setiap respons mengirim yang baru, dan `403 rest_cookie_invalid_nonce` memaksa pengambilan ulang. Tidak pernah ditulis mati di kode.
3. **Chat** — `POST /wp-json/mlp/v1/chat-stream` dengan `{message, model, conversation_id, attachments, history, lang, mode}` → `200 text/event-stream` berisi kejadian `phase · activity · progress · thinking · token · done`. Kejadian `done` membawa `{model_used, usage_tokens, conversation_id}`.
- **Katalog belum diverifikasi per model.** Kelima id dilayani secara bersamaan; `deepseek-v4.1-flash:free` adalah yang paling sering diukur ulang lewat 9Router (p50 ≈ 2,2 dtk, p90 ≈ 3,3 dtk untuk 12 panggilan berpola).
5. **Sajikan** — shim memilih satu identitas per permintaan (dipatok bearer, atau round-robin dengan cooldown 60 detik + failover) pada exit yang diwadahi selama `PTERO_EXIT_GAP` ms, lalu menjawab OpenAI `/v1/chat/completions`.
6. **Routing** — node `ptero` milik 9Router menunjuk ke shim; satu koneksi per identitas.

Endpoint lain: `/status` (kesehatan + model default), `/usage` (ember token identitas — `max: 1000000`, `reset_seconds: 3600`), `/api-keys` (daftar kunci milik tamu; kosong pada identitas baru).

Lihat [`docs/PROTOCOL.md`](../docs/PROTOCOL.md) untuk format kawat persisnya.

## ⚠️ Catatan & batasan

- **Batasnya per IP keluar, bukan per identitas.** Terukur: pada satu exit, jeda 0 ms antar-panggilan memberi 0/6 OK, 1000 ms memberi 2/6, 2500 ms memberi 6/6. Identitas baru langsung 429 sementara exit-nya panas, dan di detik yang sama model yang sama menjawab 200 lewat exit lain. **Identitas memberi ketahanan; exit memberi throughput.** Tambah exit, bukan identitas, saat butuh lebih banyak panggilan/menit. Ember per identitas itu nyata tapi longgar (1.000.000 token/jam).
- **Tabel model cepat basi.** ptero tidak punya rute `/models`; id-nya ada di bundel situs. Bila sebuah model 404, periksa bundel yang sedang hidup daripada memercayai tabel ini.
- **Tool calling hanya ada di shim.** Di hulu tidak ada bidang `tools` maupun frame SSE `tool_calls`; shim mengajarkan blok teks pada model lalu mengembalikannya menjadi `tool_calls` sungguhan — dan hanya bila permintaan Anda membawa `tools`.
- **Katalog belum diverifikasi per model.** Kelima id ter fatalities dilayani bersamaan; `deepseek-v4.1-flash:free` adalah yang paling sering diukur ulang lewat 9Router (p50 ≈ 2,2 dtk, p90 ≈ 3,3 dtk untuk 12 panggilan berpola).
- Berkas pool berisi kredensial, sesederhana apa pun itu — berkasnya sudah masuk `.gitignore`, dan repo ini tidak membawa satu pun.
- Untuk otomasi pribadi/pendidikan. Hormati ketentuan layanan ptero.pro dan 9Router.

## 📁 Struktur

```
ptero-bulk-apikey/
├── brand/                 logo.svg · icon.svg
├── docs/PROTOCOL.md       format kawat ptero.pro, langkah demi langkah
├── examples/              mint-and-chat.js · shim-and-router.js
├── i18n/                  README dalam id · zh · ja · es · de
├── src/
│   ├── cli.js             mint · shim · connect · probe · status · limit
│   ├── shim.js            /v1 OpenAI-compatible di atas pool terverifikasi
│   ├── launcher.js        banner ASCII PTERO
│   ├── connect-9router.js node penyedia + satu koneksi per identitas
│   └── lib/
│       ├── ptero.js       klien: ambil nonce, chat-stream SSE
│       ├── identity.js    pembuatan identitas 32-hex + pool round-robin
│       ├── pool.js        mint terverifikasi + pool failover
│       ├── exits.js       pemesanan exit, pacing, penalti 429
│       ├── tools.js       blok tool-call teks ⇄ tool_calls sungguhan
│       └── models.js      katalog + resolusi alias
└── package.json
```

## 📄 Lisensi

[MIT](../LICENSE) © 2026 ptero-bulk-apikey contributors