<div align="center">
<img src="../brand/logo.svg" alt="ptero-bulk" width="150" />

# ptero-bulk-apikey

**Identitäten für [ptero.pro](https://ptero.pro) im Bulk erzeugen — ohne Anmeldung, ohne E-Mail, ohne Captcha — und `deepseek-v4.1-flash` über einen lokalen OpenAI-kompatiblen Shim bereitstellen, registriert in einer laufenden [9Router](https://9router.com)-Instanz. Keine Pflicht-Abhängigkeiten.**

[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/required%20deps-0-blue.svg?style=for-the-badge)](#)
[![OpenAI compatible](https://img.shields.io/badge/API-OpenAI--compatible-412991.svg?style=for-the-badge&logo=openai&logoColor=white)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6.svg?style=for-the-badge)](#-mit-9router-verbinden)
[![Proxy](https://img.shields.io/badge/transport-HTTP%20%7C%20SOCKS5-0EA5E9.svg?style=for-the-badge)](#-transporte)
[![No signup](https://img.shields.io/badge/signup-none-22C55E.svg?style=for-the-badge)](https://ptero.pro)
[![Languages](https://img.shields.io/badge/i18n-5%20languages-F59E0B.svg?style=for-the-badge)](#-sprachen)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Deutsch](README.de.md)

</div>

---

## ✨ Funktionen

- 🪶 **Überhaupt keine Anmeldung** — eine ptero-Identität ist ein zufälliges 32-Hex-Token, das Sie selbst erzeugen. Kein Konto, keine E-Mail, kein Passwort, kein Captcha. Das Erzeugen passiert offline und sofort.
- 🔑 **Bulk-Erzeugung + Verifikation** — Identitäten landen erst im Pool, nachdem sie eine *echte* Chat-Anfrage beantwortet haben; hinter jeder Zeile im Pool steht also ein gemessener HTTP 200.
- 🔌 **OpenAI-kompatibler Shim** — ein `http://127.0.0.1:8791/v1` bedient `deepseek-v4.1-flash` und den Rest des Katalogs, mit `stream`, `tools` und Identitäts-Pinning pro Anfrage.
- 🔀 **Pacing mit Exit-Bewusstsein** — das echte Limit ist eine Drosselung *pro ausgehender IP*, deshalb reserviert der Client pro Anfrage einen Exit und stellt sich in eine Warteschlange, statt `429` auszulösen.
- 🧰 **9Router-Konnektor** — registriert den Shim als Provider-Node mit **einer Verbindung pro Identität**, sodass jede 9Router-Verbindung genau eine echte ptero-Identität ist.
- 🛠 **Angehobenes Tool-Calling** — upstream gibt es kein `tools`-Feld; der Shim bringt dem Modell einen Text-Tool-Call-Block bei und hebt ihn wieder zu echten `tool_calls` an.
- 🧩 **Bibliothek oder CLI** — nutzen Sie `Ptero`/`VerifiedPool` im Code oder starten Sie den mitgelieferten Befehl `ptero-bulk`.
- 🌍 **5 Sprachen** — EN, ID, ZH, JA, ES, DE.

## 🚀 Schnellstart

```bash
git clone https://github.com/F0Rextasy/ptero-bulk-apikey
cd ptero-bulk-apikey

# 1. 50 Identitäten erzeugen (jede mit einem echten deepseek-v4.1-flash-Aufruf verifiziert)
node src/cli.js mint --count 50 --conc 8

# 2. als OpenAI bereitstellen
node src/cli.js shim --pool identities.txt --port 8791

# 3. den Pool in eine laufende 9Router-Instanz registrieren
node src/cli.js connect --n 16
```

Danach wie jeder OpenAI-Endpunkt aufrufen:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}]}'
```

## 🛠 Verwendung

```bash
ptero-bulk mint --count 250 --conc 16       # Bulk-Erzeugung + Verifikation nach identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-kompatibles /v1 auf :8791
ptero-bulk connect --n 16                  # in 9Router registrieren (eine Verbindung pro Identität)
ptero-bulk probe --n 5 --gap 3000           # End-to-End-Aufrufe durch 9Router
ptero-bulk status                          # Upstream-/status + /usage einer frischen Identität
ptero-bulk limit --k 12                    # beweist: die Drosselung sitzt am Exit, nicht an der Identität
```

| Flag | Beschreibung | Standard |
| --- | --- | --- |
| `--count <n>` | Anzahl zu erzeugender Identitäten | `10` |
| `--conc <n>` | gleichzeitige Verifikationen (der Exit-Pool dosiert die Rate) | `5` |
| `--pool <file>` | Pool-Datei, eine Identität pro Zeile | `identities.txt` |
| `--model <id>` | Modell für Verifikation bzw. Probe | `deepseek-v4.1-flash:free` |
| `--port <n>` | Port des Shims | `8791` |
| `--host <addr>` | Bind-Adresse des Shims | `127.0.0.1` |
| `--exits <list>` | ausgehende Exits: `direct,http://host:port,…` | `$PTERO_EXITS` oder `direct` |
| `--gap <ms>` | Mindestabstand zweier Aufrufe auf demselben Exit | `2600` |
| `--router <url>` | Basis-URL von 9Router | `$N9ROUTER` oder `http://127.0.0.1:20128` |
| `--router-password <pw>` | 9Router-Login-Passwort | `$N9ROUTER_PW` oder `123456` |
| `--shim <url>` | Basis-URL des Shims, auf die der 9Router-Node zeigt | `http://127.0.0.1:8791/v1` |
| `--n <n>` | Verbindungen (connect) bzw. Aufrufe (probe) | `16` / `5` |
| `--tools` | Probe mit einem Funktions-Tool | aus |
| `--dry` | anzeigen, was `connect` tun würde, ohne etwas zu ändern | aus |

Umgebungsvariablen: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🌐 Transporte

ptero braucht **gar keinen** Exit, um zu funktionieren — eine Direktverbindung genügt, sie fängt nur früher an zu drosseln, sobald der Verkehr wächst. Die `429 Too many messages`-Drosselung gilt **pro ausgehender IP**, also:

- **direct** (Standard) — ein Kontingent, ausreichend für einen lokalen Shim oder leichte Nutzung.
- **HTTP-/SOCKS5-Proxy** — `--exits direct,http://user:pass@host:port,…` bzw. `PTERO_EXITS`. Proxy-Exits brauchen das optionale Paket `undici`; fehlt es, werden diese Exits mit einer Warnung übersprungen und der direkte Exit bedient weiter.
- **Mehrere Exits** — jeder Exit ist ein eigenes Kontingent. Der Client reserviert pro Anfrage einen Exit, beachtet `--gap`/`PTERO_EXIT_GAP` (2600 ms Standard) und parkt bei einem `429` nur diesen Exit für 20 s, um es über den nächsten erneut zu versuchen. Vier Exits im Abstand von 2,6 s ergeben rund **92 Aufrufe/Minute** für die ganze Flotte.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

## 🔌 Mit 9Router verbinden

9Router ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
npm install -g 9router && 9router        # Dashboard auf http://localhost:20128
```

ptero spricht kein einfaches HTTP-Chat, deshalb richtet der Konnektor den `openai-compatible`-Node von 9Router auf den Shim dieses Repos aus und hängt **eine Verbindung pro Pool-Identität** an — das `Authorization: Bearer <32-hex>` jeder Verbindung lässt den Shim exakt auf diese Identität routen:

```
node src/connect-9router.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
```

Registriert wird:

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

Richten Sie jeden OpenAI-kompatiblen Client darauf:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🧠 Verfügbare Modelle

Der Katalog steht fest im Website-Bundle von ptero (upstream gibt es keine `/models`-Route) und ändert sich ohne Ankündigung. Stand 2026-10-17:

| Model                     | Aufruf in 9Router                  | Anmerkung |
| ------------------------- | ---------------------------------- | --------- |
| deepseek-v4.1-flash:free  | `ptero/deepseek-v4.1-flash:free`   | ✅ das Zugpferd; durch 9Router gemessen |
| ling-3.0-flash:free       | `ptero/ling-3.0-flash:free`        | ✅ |
| mistral-nemo:minirouter   | `ptero/mistral-nemo:minirouter`    | ✅ |
| qwen3.7-flash:minirouter  | `ptero/qwen3.7-flash:minirouter`   | ✅ laut Website als Standard gemeldet |
| apodex-1.1-mini:free      | `ptero/apodex-1.1-mini:free`       | ✅ |

`GET /status` meldet außerdem, welche Ids `disabled` sind oder in `cooldown_models` stehen — `ptero-bulk status` zeigt die aktuellen Werte. Kurze Aliase (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) lösen alle auf die obige Id auf.

## 📚 Als Bibliothek

```js
const { Ptero } = require('ptero-bulk-apikey/src/lib/ptero.js');
const { mintIdentities, VerifiedPool } = require('ptero-bulk-apikey/src/lib/pool.js');

// eine Identität, ein Chat — ganz ohne Pool
const client = new Ptero();
const { text, meta } = await client.chat('Reply with the single word: ok', {
  model: 'deepseek-v4.1-flash:free',
});
console.log(text, meta.model_used);

// oder ein verifizierter Pool mit Failover
await mintIdentities({ count: 10, conc: 4, outFile: 'identities.txt' });
const pool = new VerifiedPool('identities.txt');
const out = await pool.chat({ message: 'hi', model: 'deepseek-v4.1-flash:free' });
console.log(out.identity, out.meta.model_used);
```

Ausführbare Beispiele: [`examples/mint-and-chat.js`](../examples/mint-and-chat.js), [`examples/shim-and-router.js`](../examples/shim-and-router.js).

## ⚙️ So funktioniert es

ptero.pro hat keine Registrierung. Eine Identität ist ein Token, den *Sie* erzeugen und als `X-MLP-Guest-Token` senden; das Einzige, was eine Anfrage sonst noch braucht, ist der WordPress-REST-Nonce der Website.

1. **Erzeugen** — `crypto.randomUUID().replace(/-/g,'')` → ein 32-Hex-`X-MLP-Guest-Token` (plus zufälliger Anzeigename). Sofort, offline, ohne Serveraufruf.
2. **Nonce abgreifen** — `GET https://ptero.pro/` → das HTML enthält `var nonce = "<10 hex>"`. Jede Anfrage braucht ihn als `X-WP-Nonce`; er gilt für alle Gäste, jede Antwort liefert einen frischen zurück, und ein `403 rest_cookie_invalid_nonce` erzwingt ein erneutes Abgreifen. Er wird nie fest im Code hinterlegt.
3. **Chat** — `POST /wp-json/mlp/v1/chat-stream` mit `{message, model, conversation_id, attachments, history, lang, mode}` → `200 text/event-stream` mit den Events `phase · activity · progress · thinking · token · done`. Das `done`-Event trägt `{model_used, usage_tokens, conversation_id}`.
4. **Verifizieren** — beim `mint` muss die Identität eine echte Chat-Anfrage beantworten, bevor sie in die Pool-Datei geschrieben wird.
5. **Ausliefern** — der Shim wählt pro Anfrage eine Identität (per Bearer gepinnt oder Round-Robin mit 60 s Abklingzeit und Failover) auf einem für `PTERO_EXIT_GAP` ms reservierten Exit und beantwortet OpenAI `/v1/chat/completions`.
6. **Routen** — der `ptero`-Node von 9Router zeigt auf den Shim; eine Verbindung pro Identität.

Weitere Endpunkte: `/status` (Zustand + Standardmodell), `/usage` (Token-Kontingent der Identität — `max: 1000000`, `reset_seconds: 3600`), `/api-keys` (eigene Schlüsselliste des Gasts; bei einer frischen Identität leer).

Das exakte Drahtformat steht in [`docs/PROTOCOL.md`](../docs/PROTOCOL.md).

## ⚠️ Hinweise & Grenzen

- **Das Limit gilt pro ausgehender IP, nicht pro Identität.** Gemessen: Auf einem Exit ergaben 0 ms Abstand 0/6 OK, 1000 ms 2/6, 2500 ms 6/6. Eine brandneue Identität bekommt sofort `429`, solange die IP heiß ist, und im selben Sekundenbruchteil antwortet dasselbe Modell über einen anderen Exit mit 200. **Identitäten kaufen Belastbarkeit, Exits kaufen Durchsatz.** Für mehr Aufrufe pro Minute Exits ergänzen, nicht Identitäten. Das Kontingent pro Identität ist real, aber großzügig (1.000.000 Token/Stunde).
- **Die Modelltabelle veraltet schnell.** ptero hat keine `/models`-Route; die Ids stehen im Website-Bundle. Wenn ein Modell 404 liefert, prüfen Sie das aktuelle Bundle, statt dieser Tabelle zu glauben.
- **Tool-Calling existiert nur im Shim.** Upstream gibt es kein `tools`-Feld und kein `tool_calls`-SSE-Frame; der Shim bringt dem Modell einen Textblock bei und hebt ihn zu echten `tool_calls` an — und zwar nur, wenn Ihre Anfrage `tools` mitbringt.
- **Der Katalog ist nicht je Modell verifiziert.** Alle fünf Ids wurden gleichzeitig bedient; `deepseek-v4.1-flash:free` ist das am häufigsten neu gemessene (p50 ≈ 2,2 s, p90 ≈ 3,3 s über 12 getaktete Aufrufe).
- Die Pool-Datei enthält Anmeldedaten, so anonym sie auch sind — sie ist in `.gitignore`, und dieses Repo liefert keine mit.
- Für persönliche/bildungsbezogene Automatisierung. Beachten Sie die Nutzungsbedingungen von ptero.pro und 9Router.

## 📁 Struktur

```
ptero-bulk-apikey/
├── brand/                 logo.svg · icon.svg
├── docs/PROTOCOL.md       Drahtformat von ptero.pro, Schritt für Schritt
├── examples/              mint-and-chat.js · shim-and-router.js
├── i18n/                  README in id · zh · ja · es · de
├── src/
│   ├── cli.js             mint · shim · connect · probe · status · limit
│   ├── shim.js            OpenAI-kompatibles /v1 über einen verifizierten Pool
│   ├── launcher.js        PTERO-ASCII-Banner
│   ├── connect-9router.js Provider-Node + eine Verbindung pro Identität
│   └── lib/
│       ├── ptero.js       Client: Nonce-Abgriff, SSE-Chat-Stream
│       ├── identity.js    32-Hex-Identitätserzeugung + Round-Robin-Pool
│       ├── pool.js        verifiziertes Minten + Failover-Pool
│       ├── exits.js       Exit-Reservierung, Pacing, 429-Strafen
│       ├── tools.js       Text-Tool-Call-Block ⇄ echte tool_calls
│       └── models.js      Katalog + Alias-Auflösung
└── package.json
```

## 📄 Lizenz

[MIT](../LICENSE) © 2026 ptero-bulk-apikey contributors