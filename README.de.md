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

**Massenhaft ptero.pro-Identitäten mit automatisch generierten API-Schlüsseln erzeugen — OpenAI-kompatible Inferenz über einen lokalen Shim (deepseek-v4.1-flash und der Rest des Katalogs) + 9Router-Konnektor.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenlose Stufe](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-5-of-them) · [🧪 Die API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 Kostenlose Stufe — wie viel du bekommst

**ptero.pro hat überhaupt keine Registrierung: Eine Identität ist ein zufälliges 32-Hex-Token, das du selbst generierst, es gibt also nichts zu bezahlen und nichts, wofür du dich anmelden müsstest.**

| Was | Wert |
| --- | --- |
| Erforderliches Konto | **Keines** — keine E-Mail, kein Passwort, kein Captcha, keine Karte |
| Kosten für die Erzeugung | **null** — das Token wird offline generiert, sofort |
| Bucket pro Identität | **1.000.000 Tokens / Stunde** (`max: 1000000`, `reset_seconds: 3600` aus `/usage`) |
| Tatsächliches Durchsatzlimit | **pro ausgehender IP**, nicht pro Identität — siehe Tabelle unten |
| Was eine Identität bringt | Ausfallsicherheit (Cooldown + Failover), nicht Durchsatz |
| Die Einheit, die skaliert | **Exits**, nicht Identitäten → füge Exits hinzu, wenn du mehr Aufrufe/Minute brauchst |

**Gemessen über einen Exit** (`deepseek-v4.1-flash:free`, Abstand zwischen Aufrufen → Erfolge von 6):

| Abstand | Ergebnis |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

Vier Exits bei einem Abstand von 2,6 s ≈ **92 Aufrufe/Minute** flottenweit.

> 💡 Die kostenlose Stufe wird von ptero.pro festgelegt und kann sich ändern. Prüfe die Live-Zahlen auf [ptero.pro](https://ptero.pro) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 5 davon

Der Katalog ist im Site-Bundle von ptero fest verdrahtet (es gibt keine Upstream-Route `/models`) und ändert sich ohne Vorankündigung. Stand der Bereitstellung am 2026-10-17:

| Modell | Aufruf wie in 9Router | Hinweise |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ das Flaggschiff; gemessen über 9Router (p50 ≈ 2,2 s, p90 ≈ 3,3 s über 12 getaktete Aufrufe) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ wird als Site-Standard gemeldet |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` meldet außerdem, welche IDs `disabled` / in `cooldown_models` sind — führe `ptero-bulk status` aus, um die Live-Werte zu sehen. Kurze Aliase (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) lösen alle zur obigen ID auf. Wenn ein Modell 404 zurückgibt, prüfe das Live-Bundle erneut, statt dieser Tabelle zu vertrauen.

## 🧪 So verwendest du die API

ptero spricht upstream kein einfaches HTTP-Chat — es antwortet mit einem SSE-Stream auf seiner eigenen Route. Der **Shim** dieses Repositories macht daraus eine gewöhnliche OpenAI-Oberfläche auf **`http://127.0.0.1:8791/v1`**:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

Der Shim unterstützt `stream`, `tools` (aus dem Text-Tool-Call-Block des Modells in echte `tool_calls` gehoben) und Identity-Pinning pro Anfrage: Ein Bearer, der zu einer Pool-Identität passt, wird an genau diese Identität geroutet, andernfalls wird mit 60 s Cooldown + Failover im Round-Robin-Verfahren verteilt.

## 🛠 Schnellstart

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

`identities.txt` enthält eine 32-Hex-Identität pro Zeile, und nur Identitäten, die auf einen echten Chat-Aufruf geantwortet haben, werden hineingeschrieben.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` enthält eine 32-Hex-Identität pro Zeile, und nur Identitäten, die auf einen echten Chat-Aufruf geantwortet haben, werden hineingeschrieben.
### 🖱️ Der Launcher

Hier gibt es kein interaktives Menü — die CLI ist die Schnittstelle und jede Aufgabe ist ein Befehl (`mint`, `shim`, `connect`, `probe`, `status`, `limit`). `node src/cli.js` ohne Aufgabe gibt das PTERO-Banner und die Aufgabenliste aus, und jedes Flag hat auch eine Umgebungsvariable (`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

Dieselbe Launcher-Verknüpfung registriert den Pool, ohne den Konnektor auszuschreiben: `node src/launcher.js --connect-9router …` übergibt den Rest der Kommandozeile an `src/connect-9router.js` und `node src/launcher.js --connect-omniroute …` übergibt sie an `src/connect-omniroute.js`; ohne eines der beiden Flags wird nur das PTERO-Banner ausgegeben.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

| Prüfung | Ergebnis |
| --- | --- |
| Identität erzeugen | `crypto.randomUUID().replace(/-/g,'')` → ein 32-Hex-`X-MLP-Guest-Token`; sofort, offline, kein Serveraufruf |
| Nonce-Scrape | `GET https://ptero.pro/` enthält `var nonce = "<10 hex>"`; ein `403 rest_cookie_invalid_nonce` erzwingt ein erneutes Scrapen, es wird nie fest verdrahtet |
| Live-Nachweis | die Identität muss auf ein echtes `POST /wp-json/mlp/v1/chat-stream` antworten, bevor sie in die Pool-Datei geschrieben wird |
| über 9Router | `ptero-bulk probe` — gemessen p50 ≈ 2,2 s, p90 ≈ 3,3 s über 12 getaktete Aufrufe auf `deepseek-v4.1-flash:free` |
| Pool-Datei | enthält Anmeldedaten, wie anonym auch immer — sie ist git-ignoriert und dieses Repo liefert keine mit |

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro hat keine Registrierung. Eine Identität ist ein Token, das *du* generierst und als `X-MLP-Guest-Token` sendest; das Einzige, was eine Anfrage sonst noch braucht, ist der WordPress-REST-Nonce der Site.

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| erzeugen | lokal | `crypto.randomUUID().replace(/-/g,'')` → 32-Hex-Identität + ein zufälliger Anzeigename |
| Nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`; gastweit, jede Antwort gibt einen frischen zurück |
| Chat | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream` mit Ereignissen `phase · activity · progress · thinking · token · done`; `done` trägt `{model_used, usage_tokens, conversation_id}` |
| verifizieren | derselbe Aufruf | die Identität muss auf einen echten Chat antworten, bevor sie in den Pool geschrieben wird |
| bereitstellen | lokaler Shim | wählt pro Anfrage eine Identität auf einem Exit, der für `PTERO_EXIT_GAP` ms reserviert ist, und antwortet auf OpenAI `/v1/chat/completions` |
| routen | 9Router | der `ptero`-Knoten zeigt auf den Shim; eine Verbindung pro Identität |

Weitere Endpunkte: `/status` (Zustand + Standardmodell), `/usage` (der Token-Bucket der Identität), `/api-keys` (die eigene Schlüsselliste eines Gastes; bei einer frischen Identität leer). Das genaue Wire-Format steht in [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## ⚙️ CLI-Optionen

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| Flag | Bedeutung | Standard |
| --- | --- | --- |
| `--count <n>` | Anzahl der zu erzeugenden Identitäten | `10` |
| `--conc <n>` | gleichzeitige Verifizierungen (der Exit-Pool taktet die Rate) | `5` |
| `--pool <file>` | Pool-Datei, eine Identität pro Zeile | `identities.txt` |
| `--model <id>` | Modell, das der Verifizierungs-/Probe-Aufruf verwendet | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | Shim-Listen-Port / Bind-Adresse | `8791` / `127.0.0.1` |
| `--exits <list>` | ausgehende Exits: `direct,http://host:port,…` | `$PTERO_EXITS` oder `direct` |
| `--gap <ms>` | Mindestabstand zwischen zwei Aufrufen auf einem Exit | `2600` |
| `--router <url>` / `--router-password <pw>` | 9Router-Basis / Login-Passwort | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | Shim-Basis-URL, auf die der 9Router-Knoten zeigt | `http://127.0.0.1:8791/v1` |
| `--n <n>` | Verbindungen (connect) oder Aufrufe (probe) | `16` / `5` |
| `--tools` / `--dry` | Probe mit einem Funktions-Tool / zeigen, was `connect` tun würde | aus / aus |

Umgebung: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ Hinter einem Proxy

ptero braucht **keinen** Exit, um zu funktionieren — eine direkte Verbindung ist in Ordnung, sie beginnt nur früher mit der Ratenbegrenzung, sobald du Traffic schickst. Die Drosselung `429 Too many messages` gilt **pro ausgehender IP**, also:

- **direct** (Standard) — ein Bucket, in Ordnung für einen lokalen Shim oder leichte Nutzung.
- **HTTP-/SOCKS5-Proxy** — `--exits direct,http://user:pass@host:port,…` oder `PTERO_EXITS`. Proxy-Exits benötigen das optionale `undici`-Paket; wenn es fehlt, werden diese Exits mit einer Warnung übersprungen und der direkte Exit bedient weiterhin.
- **Mehrere Exits** — jeder Exit ist sein eigener Bucket. Der Client reserviert einen Exit pro Anfrage, beachtet `--gap` / `PTERO_EXIT_GAP` (Standard 2600 ms) und legt bei einem `429` nur diesen Exit für 20 s still und versucht es beim nächsten erneut.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**Identitäten bringen Ausfallsicherheit; Exits bringen Durchsatz.** Eine brandneue Identität bekommt sofort ein 429, während ein Exit heiß ist, und in derselben Sekunde antwortet dasselbe Modell mit 200 über einen anderen Exit.

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `identities.txt` | eine verifizierte 32-Hex-Identität pro Zeile — git-ignoriert (Anmeldedaten, wie anonym auch immer) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | das OpenAI-kompatible `/v1` über einen verifizierten Pool |
| `src/connect-9router.js` | Provider-Knoten + eine Verbindung pro Identität |
| `src/lib/` | `ptero.js` (Nonce-Scrape, SSE-Chat-Stream), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | ptero.pro-Wire-Format, Schritt für Schritt |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router (`npm install -g 9router && 9router`, Dashboard auf `http://localhost:20128`).

ptero spricht kein einfaches HTTP-Chat, daher richtet der Konnektor den `openai-compatible`-Knoten von 9Router auf den **Shim** dieses Repos und hängt **eine Verbindung pro Pool-Identität** an — das `Authorization: Bearer <32-hex>` jeder Verbindung lässt den Shim sie an genau diese Identität routen:

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

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router (`npm install -g omniroute && omniroute`, Dashboard auf `http://localhost:20128`).

ptero spricht kein einfaches HTTP-Chat, daher richtet der Konnektor den `openai-compatible`-Knoten von OmniRoute auf den **Shim** dieses Repos und hängt **eine Verbindung pro Pool-Identität** an — das `Authorization: Bearer <32-hex>` jeder Verbindung lässt den Shim sie an genau diese Identität routen:

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

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 Was der Anbieter gibt | keine Anmeldung, keine E-Mail, kein Captcha — 1.000.000 Tokens/Stunde pro Identität, Durchsatz durch deine Exits bestimmt |
| 🔑 Was ein Schlüssel dir bringt | ein API-Schlüssel, der auf sein eigenes Konto beschränkt ist: die 5 Modell-IDs am unten stehenden Endpunkt, im Rahmen der Limits deines Tarifs. Das Kontingent liegt beim **Konto**, weshalb dieses Tool genau ein Konto pro Schlüssel erstellt |
| 🌐 API-Form | OpenAI-kompatibel: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 Deine Daten | nur ptero.pro und das von dir konfigurierte Inbox-Backend werden kontaktiert; Schlüssel bleiben auf deinem Rechner |

## 🐞 Probleme

Wenn ptero.pro die Nonce-Form, die Chat-Stream-Route oder die Modell-IDs ändert, stoppt das Tool an diesem Schritt und sagt es. **[Öffne ein Issue](../../issues)** mit dem ausgeführten Befehl und der genauen Ausgabe; PRs sind willkommen.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>