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

**Otomatik oluşturulan API anahtarlarıyla toplu ptero.pro kimliği üretin — yerel bir shim üzerinden OpenAI uyumlu çıkarım (deepseek-v4.1-flash ve kataloğun geri kalanı) + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-5-of-them) · [🧪 API'yi kullanma](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 Ücretsiz katman — ne kadar elde edersiniz

**ptero.pro'da hiç kayıt yoktur: bir kimlik, kendi oluşturduğunuz rastgele 32 haneli onaltılık bir belirteçtir, yani ödeme yapılacak bir şey ve kaydolunacak bir şey yoktur.**

| Ne | Değer |
| --- | --- |
| Gerekli hesap | **Yok** — e-posta yok, parola yok, captcha yok, kart yok |
| Üretim maliyeti | **sıfır** — belirteç çevrimdışı, anında oluşturulur |
| Kimlik başına kota | **1.000.000 belirteç / saat** (`/usage`'dan `max: 1000000`, `reset_seconds: 3600`) |
| Gerçek işlem hızı sınırı | **çıkış IP'si başına**, kimlik başına değil — aşağıdaki tabloya bakın |
| Bir kimliğin sağladığı | dayanıklılık (bekleme + yedekleme), işlem hızı değil |
| Ölçeklenen birim | **çıkışlar**, kimlikler değil → daha fazla çağrı/dk gerektiğinde çıkış ekleyin |

**Tek bir çıkışta ölçüldü** (`deepseek-v4.1-flash:free`, çağrılar arası boşluk → 6 denemeden başarılı olanlar):

| Boşluk | Sonuç |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

2,6 sn boşlukla dört çıkış ≈ filo genelinde **92 çağrı/dk**.

> 💡 Ücretsiz katman ptero.pro tarafından belirlenir ve değişebilir. Canlı sayıları [ptero.pro](https://ptero.pro) adresinden kontrol edin — ve aracın kendi kapısının karar vermesine izin verin:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modeller — 5 tanesinin tamamı

Katalog ptero'nun site paketinde sabit kodlanmıştır (yukarı akışta `/models` rotası yoktur) ve haber verilmeden değişir. 2026-10-17 tarihinde sunulduğu şekliyle:

| Model | 9Router'da çağrım | Notlar |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ amiral gemisi; 9Router üzerinden ölçüldü (12 tempolu çağrıda p50 ≈ 2,2 sn, p90 ≈ 3,3 sn) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ sitenin varsayılanı olarak bildiriliyor |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` ayrıca hangi kimliklerin `disabled` / `cooldown_models` içinde olduğunu bildirir — canlı değerleri görmek için `ptero-bulk status` çalıştırın. Kısa takma adlar (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) yukarıdaki kimliğe çözümlenir. Bir model 404 verirse, bu tabloya güvenmek yerine canlı paketi yeniden kontrol edin.

## 🧪 API nasıl kullanılır

ptero yukarı akışta düz HTTP sohbeti konuşmaz — kendi rotasında bir SSE akışı yanıtlar. Bu depodaki **shim** bunu **`http://127.0.0.1:8791/v1`** üzerinde sıradan bir OpenAI yüzeyine dönüştürür:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

Shim `stream`, `tools` (modelin metin araç-çağrısı bloğundan gerçek `tool_calls`'a yükseltilir) ve istek başına kimlik sabitlemeyi destekler: havuzdaki bir kimlikle eşleşen bir bearer o tam kimliğe yönlendirir, aksi halde 60 sn bekleme + yedekleme ile sırayla döner.

## 🛠 Hızlı başlangıç

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

`identities.txt` her satırda bir 32 haneli onaltılık kimlik tutar ve yalnızca gerçek bir sohbet çağrısını yanıtlayan kimlikler bu dosyaya yazılır.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` her satırda bir 32 haneli onaltılık kimlik tutar ve yalnızca gerçek bir sohbet çağrısını yanıtlayan kimlikler bu dosyaya yazılır.
### 🖱️ Başlatıcı

Burada etkileşimli bir menü yoktur — arayüz CLI'dır ve her görev tek bir komuttur (`mint`, `shim`, `connect`, `probe`, `status`, `limit`). Görev belirtilmeden `node src/cli.js` PTERO banner'ını ve görev listesini yazdırır ve her bayrağın ayrıca bir ortam değişkeni vardır (`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

Aynı başlatıcı kısayolu, bağlayıcıyı açıkça belirtmeden havuzu kaydeder: `node src/launcher.js --connect-9router …` komut satırının geri kalanını `src/connect-9router.js` dosyasına devreder ve `node src/launcher.js --connect-omniroute …` bunu `src/connect-omniroute.js` dosyasına devreder; hiçbir bayrak verilmezse yalnızca PTERO banner'ını yazdırır.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

| Kontrol | Sonuç |
| --- | --- |
| kimlik üretimi | `crypto.randomUUID().replace(/-/g,'')` → 32 haneli onaltılık bir `X-MLP-Guest-Token`; anında, çevrimdışı, sunucu çağrısı yok |
| nonce kazıma | `GET https://ptero.pro/` içinde `var nonce = "<10 hex>"` bulunur; bir `403 rest_cookie_invalid_nonce` yeniden kazımayı zorlar, asla sabit kodlanmaz |
| canlı kanıt | kimlik, havuza yazılmadan önce gerçek bir `POST /wp-json/mlp/v1/chat-stream` çağrısını yanıtlamalıdır |
| 9Router üzerinden | `ptero-bulk probe` — `deepseek-v4.1-flash:free` üzerinde 12 tempolu çağrıda p50 ≈ 2,2 sn, p90 ≈ 3,3 sn ölçüldü |
| havuz dosyası | ne kadar anonim olursa olsun kimlik bilgileri içerir — git tarafından yok sayılır ve bu depo hiçbirini içermez |

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro'da kayıt yoktur. Bir kimlik, *sizin* oluşturduğunuz ve `X-MLP-Guest-Token` olarak gönderdiğiniz bir belirteçtir; bir isteğin ihtiyaç duyduğu tek diğer şey sitenin WordPress REST nonce'udur.

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| üretim | yerel | `crypto.randomUUID().replace(/-/g,'')` → 32 haneli onaltılık kimlik + rastgele bir görünen ad |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`; misafir geneli, her yanıt yeni bir tane yansıtır |
| sohbet | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream`, olaylar `phase · activity · progress · thinking · token · done`; `done` içinde `{model_used, usage_tokens, conversation_id}` taşır |
| doğrulama | aynı çağrı | kimlik, havuza yazılmadan önce gerçek bir sohbeti yanıtlamalıdır |
| sunum | yerel shim | `PTERO_EXIT_GAP` ms için ayrılmış bir çıkışta istek başına bir kimlik seçer, OpenAI `/v1/chat/completions` yanıtlar |
| yönlendirme | 9Router | `ptero` düğümü shim'e işaret eder; kimlik başına bir bağlantı |

Diğer uç noktalar: `/status` (sağlık + varsayılan model), `/usage` (kimliğin belirteç kotası), `/api-keys` (bir misafirin kendi anahtar listesi; yeni bir kimlikte boş). Tam tel formatı [`docs/PROTOCOL.md`](docs/PROTOCOL.md) içindedir.

## ⚙️ CLI seçenekleri

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| Bayrak | Anlamı | Varsayılan |
| --- | --- | --- |
| `--count <n>` | üretilecek kimlik sayısı | `10` |
| `--conc <n>` | eşzamanlı doğrulama sayısı (hızı çıkış havuzu ayarlar) | `5` |
| `--pool <file>` | havuz dosyası, satır başına bir kimlik | `identities.txt` |
| `--model <id>` | doğrulama / probe çağrısının kullandığı model | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | shim dinleme portu / bağlanma adresi | `8791` / `127.0.0.1` |
| `--exits <list>` | çıkış noktaları: `direct,http://host:port,…` | `$PTERO_EXITS` veya `direct` |
| `--gap <ms>` | bir çıkışta iki çağrı arasındaki minimum boşluk | `2600` |
| `--router <url>` / `--router-password <pw>` | 9Router temel adresi / giriş parolası | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | 9Router düğümünün işaret ettiği shim temel URL'si | `http://127.0.0.1:8791/v1` |
| `--n <n>` | bağlantılar (connect) veya çağrılar (probe) | `16` / `5` |
| `--tools` / `--dry` | bir işlev aracıyla probe / `connect`'in ne yapacağını göster | kapalı / kapalı |

Ortam: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ Proxy arkasında

ptero'nun çalışması için **hiçbir** çıkışa ihtiyacı yoktur — doğrudan bağlantı yeterlidir, yalnızca trafiği artırdığınızda hız sınırlaması daha erken başlar. `429 Too many messages` kısıtlaması **çıkış IP'si başına**dır, yani:

- **doğrudan** (varsayılan) — tek kota, yerel bir shim veya hafif kullanım için uygundur.
- **HTTP / SOCKS5 proxy** — `--exits direct,http://user:pass@host:port,…` veya `PTERO_EXITS`. Proxy'li çıkışlar isteğe bağlı `undici` paketini gerektirir; yoksa bu çıkışlar bir uyarıyla atlanır ve doğrudan çıkış yine hizmet verir.
- **Birden fazla çıkış** — her çıkış kendi kotasıdır. İstemci istek başına bir çıkış ayırır, `--gap` / `PTERO_EXIT_GAP` (varsayılan 2600 ms) değerine uyar ve bir `429` durumunda yalnızca o çıkışı 20 sn için park eder ve bir sonrakinde yeniden dener.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**Kimlikler dayanıklılık satın alır; çıkışlar işlem hızı satın alır.** Yepyeni bir kimlik, bir çıkış sıcakken anında 429 alır ve aynı saniyede aynı model farklı bir çıkış üzerinden 200 yanıtlar.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `identities.txt` | satır başına bir doğrulanmış 32 haneli onaltılık kimlik — git tarafından yok sayılır (ne kadar anonim olursa olsun kimlik bilgileri) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | doğrulanmış bir havuz üzerinde OpenAI uyumlu `/v1` |
| `src/connect-9router.js` | sağlayıcı düğümü + kimlik başına bir bağlantı |
| `src/lib/` | `ptero.js` (nonce kazıma, SSE chat-stream), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | ptero.pro tel formatı, adım adım |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 9Router'a bağlanma

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir (`npm install -g 9router && 9router`, kontrol paneli `http://localhost:20128` adresinde).

ptero düz HTTP sohbeti konuşmadığı için bağlayıcı, 9Router'ın `openai-compatible` düğümünü bu deponun **shim**'ine işaret ettirir ve **havuzdaki her kimlik için bir bağlantı** ekler — her bağlantının `Authorization: Bearer <32-hex>` başlığı shim'in onu tam o kimliğe yönlendirmesini sağlar:

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

## 🔌 OmniRoute'a bağlanma

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir (`npm install -g omniroute && omniroute`, kontrol paneli `http://localhost:20128` adresinde).

ptero düz HTTP sohbeti konuşmadığı için bağlayıcı, OmniRoute'un `openai-compatible` düğümünü bu deponun **shim**'ine işaret ettirir ve **havuzdaki her kimlik için bir bağlantı** ekler — her bağlantının `Authorization: Bearer <32-hex>` başlığı shim'in onu tam o kimliğe yönlendirmesini sağlar:

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

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 Sağlayıcının verdikleri | kayıt yok, e-posta yok, captcha yok — kimlik başına saatte 1.000.000 belirteç, işlem hızı çıkışlarınıza bağlı |
| 🔑 Bir anahtar size ne kazandırır | kendi hesabına kapsanmış bir API anahtarı: aşağıdaki uç noktada 5 model kimliği, planınızın sınırlarında. Kota **hesapta** yaşar, bu aracın anahtar başına bir hesap oluşturmasının nedeni tam da budur |
| 🌐 API şekli | OpenAI uyumlu: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca ptero.pro ve yapılandırdığınız gelen kutusu arka ucuyla iletişim kurulur; anahtarlar makinenizde kalır |

## 🐞 Sorunlar

ptero.pro nonce şeklini, chat-stream rotasını veya model kimliklerini değiştirirse, araç o adımda durur ve bunu bildirir. Çalıştırdığınız komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**; PR'lar memnuniyetle karşılanır.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>