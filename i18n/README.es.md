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

**Genera identidades de [ptero.pro](https://ptero.pro) en masa — sin registro, sin correo electrónico, sin captcha — y sirve `deepseek-v4.1-flash` mediante un shim local compatible con OpenAI, registrado en una instancia de [9Router](https://9router.com) en marcha. Cero dependencias obligatorias.**

[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/required%20deps-0-blue.svg?style=for-the-badge)](#)
[![OpenAI compatible](https://img.shields.io/badge/API-OpenAI--compatible-412991.svg?style=for-the-badge&logo=openai&logoColor=white)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6.svg?style=for-the-badge)](#-conectar-con-9router)
[![Proxy](https://img.shields.io/badge/transport-HTTP%20%7C%20SOCKS5-0EA5E9.svg?style=for-the-badge)](#-transportes)
[![No signup](https://img.shields.io/badge/signup-none-22C55E.svg?style=for-the-badge)](https://ptero.pro)
[![Languages](https://img.shields.io/badge/i18n-5%20languages-F59E0B.svg?style=for-the-badge)](#)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Deutsch](README.de.md)

</div>

---

## ✨ Características

- 🪶 **Sin registro alguno** — una identidad de ptero es un token aleatorio de 32 hex que generas tú mismo. Sin cuenta, sin correo electrónico, sin contraseña, sin captcha. La generación es offline e inmediata.
- 🔑 **Generación masiva + verificación** — las identidades solo se escriben en el pool después de responder a una petición de *chat* real, así que cada línea del pool tiene detrás un HTTP 200 medido.
- 🔌 **Shim compatible con OpenAI** — un único `http://127.0.0.1:8791/v1` que sirve `deepseek-v4.1-flash` y el resto del catálogo, con `stream`, `tools` e identidad fijada por petición.
- 🔀 **Ritmo consciente de las salidas** — el límite real es una *limitación por IP de salida*, así que el cliente reserva una salida por petición y hace cola en lugar de provocar un `429`.
- 🧰 **Conector de 9Router** — registra el shim como nodo de proveedor con **una conexión por identidad**, de modo que cada conexión de 9Router es una identidad real de ptero.
- 🛠 **Tool calling elevado** — arriba no hay campo `tools`; el shim enseña al modelo un bloque de llamada a herramienta en texto y lo eleva a `tool_calls` reales.
- 🧩 **Biblioteca o CLI** — usa `Ptero`/`VerifiedPool` en tu código, o ejecuta el comando incluido `ptero-bulk`.
- 🌍 **5 idiomas** — EN, ID, ZH, JA, ES, DE.

## 🚀 Inicio rápido

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

Luego llámalo como cualquier endpoint de OpenAI:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}]}'
```

## 🛠 Uso

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
| `--count <n>` | identidades a generar | `10` |
| `--conc <n>` | verificaciones en curso (el pool de salidas marca el ritmo) | `5` |
| `--pool <file>` | archivo del pool, una identidad por línea | `identities.txt` |
| `--model <id>` | modelo que usa la llamada de verificación / probe | `deepseek-v4.1-flash:free` |
| `--port <n>` | puerto de escucha del shim | `8791` |
| `--host <addr>` | dirección de enlace del shim | `127.0.0.1` |
| `--exits <list>` | salidas de egreso: `direct,http://host:port,…` | `$PTERO_EXITS` o `direct` |
| `--gap <ms>` | intervalo mínimo entre dos llamadas en una misma salida | `2600` |
| `--router <url>` | URL base de 9Router | `$N9ROUTER` o `http://127.0.0.1:20128` |
| `--router-password <pw>` | contraseña de inicio de sesión de 9Router | `$N9ROUTER_PW` o `123456` |
| `--shim <url>` | URL base del shim a la que apunta el nodo de 9Router | `http://127.0.0.1:8791/v1` |
| `--n <n>` | conexiones (connect) o llamadas (probe) | `16` / `5` |
| `--tools` | probe con una herramienta de tipo función | desactivado |
| `--dry` | muestra lo que haría `connect`, sin cambiar nada | desactivado |

Entorno: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_KEYS`/`PTERO_BASE`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🌐 Transportes

ptero **no** necesita ninguna salida para funcionar — una conexión directa vale, simplemente empieza a limitar antes el ritmo cuando aumentas el tráfico. El límite `429 Too many messages` es **por IP de salida**, así que:

- **direct** (predeterminado) — un único cubo, suficiente para un shim local o un uso ligero.
- **Proxy HTTP / SOCKS5** — `--exits direct,http://user:pass@host:port,…` o `PTERO_EXITS`. Las salidas con proxy necesitan el paquete opcional `undici`; si no está, esas salidas se omiten con una advertencia y la salida directa sigue sirviendo.
- **Varias salidas** — cada salida es su propio cubo. El cliente reserva una salida por petición, respeta `--gap`/`PTERO_EXIT_GAP` (2600 ms por defecto) y, ante un `429`, aparca solo esa salida durante 20 s y reintenta en la siguiente. Cuatro salidas con un intervalo de 2.6 s ≈ **92 llamadas/min** en toda la flota.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

## 🔌 Conectar con 9Router

9Router es un router autoalojado compatible con OpenAI:

```bash
npm install -g 9router && 9router        # dashboard on http://localhost:20128
```

ptero no habla chat HTTP plano, así que el conector apunta el nodo `openai-compatible` de 9Router al shim de este repo y adjunta **una conexión por identidad del pool** — el `Authorization: Bearer <32-hex>` de cada conexión hace que el shim la dirija a esa identidad exacta:

```
node src/connect-9router.js --shim http://127.0.0.1:8791/v1 --pool identities.txt --n 16
```

Esto registra:

```
Endpoint : http://localhost:20128/v1
Models   : ptero/deepseek-v4.1-flash:free, ptero/ling-3.0-flash:free,
           ptero/mistral-nemo:minirouter, ptero/qwen3.7-flash:minirouter,
           ptero/apodex-1.1-mini:free
```

Apunta cualquier cliente compatible con OpenAI hacia allí:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-<9router key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"ptero/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 🧠 Modelos disponibles

El catálogo está codificado en el bundle del sitio de ptero (no hay ruta `/models` en el upstream) y cambia sin previo aviso. Tal como se servía el 2026-10-17:

| Model                     | Call as in 9Router                    | Notes |
| ------------------------- | ------------------------------------- | ----- |
| deepseek-v4.1-flash:free  | `ptero/deepseek-v4.1-flash:free`      | ✅ el más destacado; medido a través de 9Router |
| ling-3.0-flash:free       | `ptero/ling-3.0-flash:free`           | ✅ |
| mistral-nemo:minirouter   | `ptero/mistral-nemo:minirouter`       | ✅ |
| qwen3.7-flash:minirouter  | `ptero/qwen3.7-flash:minirouter`      | ✅ reportado como el predeterminado del sitio |
| apodex-1.1-mini:free      | `ptero/apodex-1.1-mini:free`          | ✅ |

`GET /status` también informa de qué ids están `disabled` o en `cooldown_models` — ejecuta `ptero-bulk status` para ver los valores en vivo. Los alias cortos (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) resuelven todos al id de arriba.

## 📚 Como biblioteca

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

Ejemplos ejecutables: [`examples/mint-and-chat.js`](../examples/mint-and-chat.js), [`examples/shim-and-router.js`](../examples/shim-and-router.js).

## ⚙️ Cómo funciona

ptero.pro no tiene registro. Una identidad es un token que generas *tú* y envías como `X-MLP-Guest-Token`; lo único más que necesita una petición es el nonce REST de WordPress del sitio.

1. **Generar** — `crypto.randomUUID().replace(/-/g,'')` → un `X-MLP-Guest-Token` de 32 hex (más un nombre visible aleatorio). Instantáneo, offline, sin llamada al servidor.
2. **Extraer el nonce** — `GET https://ptero.pro/` → el HTML contiene `var nonce = "<10 hex>"`. Cada petición lo necesita como `X-WP-Nonce`; es global para los invitados, cada respuesta devuelve uno fresco y un `403 rest_cookie_invalid_nonce` obliga a volver a extraerlo. Nunca está fijado en el código.
3. **Chat** — `POST /wp-json/mlp/v1/chat-stream` con `{message, model, conversation_id, attachments, history, lang, mode}` → `200 text/event-stream` con los eventos `phase · activity · progress · thinking · token · done`. El evento `done` lleva `{model_used, usage_tokens, conversation_id}`.
4. **Verificar** — durante `mint`, la identidad debe responder a una petición de chat real antes de escribirse en el archivo del pool.
5. **Servir** — el shim elige una identidad por petición (fijada por el bearer; si no, round-robin con 60 s de cooldown + failover) sobre una salida reservada durante `PTERO_EXIT_GAP` ms, y responde en el `/v1/chat/completions` de OpenAI.
6. **Enrutar** — el nodo `ptero` de 9Router apunta al shim; una conexión por identidad.

Otros endpoints: `/status` (salud + modelo predeterminado), `/usage` (el cubo de tokens de la identidad — `max: 1000000`, `reset_seconds: 3600`), `/api-keys` (la lista de claves del propio invitado; vacía en una identidad recién creada).

Consulta [`docs/PROTOCOL.md`](../docs/PROTOCOL.md) para el formato exacto del protocolo.

## ⚠️ Notas y límites

- **El límite es por IP de salida, no por identidad.** Medido: en una salida, un intervalo de 0 ms entre llamadas da 0/6 OK, 1000 ms da 2/6, 2500 ms da 6/6. Una identidad recién creada recibe un 429 al instante mientras la salida está caliente, y en el mismo segundo el mismo modelo responde 200 por otra salida. **Las identidades dan resiliencia; las salidas dan rendimiento.** Añade salidas, no identidades, cuando necesites más llamadas/min. El cubo por identidad es real, pero generoso (1,000,000 tokens/hora).
- **La tabla de modelos se queda obsoleta.** ptero no tiene ruta `/models`; los ids viven en el bundle del sitio. Si un modelo devuelve 404, vuelve a comprobar el bundle en vivo en lugar de fiarte de esta tabla.
- **El tool calling solo existe en el shim.** En el upstream no hay campo `tools` ni frame SSE `tool_calls`; el shim enseña al modelo un bloque de texto y lo eleva a `tool_calls` reales — y solo cuando tu petición lleva `tools`.
- **El catálogo no está verificado modelo por modelo.** Los cinco ids se sirvieron a la vez; `deepseek-v4.1-flash:free` es el que se ha remedido repetidamente a través de 9Router (p50 ≈ 2.2 s, p90 ≈ 3.3 s en 12 llamadas espaciadas).
- El archivo del pool contiene credenciales, por muy anónimas que sean — está excluido por git, y este repo no incluye ninguna.
- Para automatización personal/educativa. Respeta los términos del servicio de ptero.pro y de 9Router.

## 📁 Estructura

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

## 📄 Licencia

[MIT](../LICENSE) © 2026 ptero-bulk-apikey contributors