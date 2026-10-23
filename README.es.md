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

**Crea identidades de ptero.pro en masa con claves API autogeneradas — inferencia compatible con OpenAI a través de un shim local (deepseek-v4.1-flash y el resto del catálogo) + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-5-of-them) · [🧪 Usar la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 Nivel gratuito — cuánto obtienes

**ptero.pro no tiene registro en absoluto: una identidad es un token aleatorio de 32 caracteres hexadecimales que generas tú mismo, así que no hay nada que pagar ni nada a lo que registrarse.**

| Qué | Valor |
| --- | --- |
| Cuenta requerida | **Ninguna** — sin correo electrónico, sin contraseña, sin captcha, sin tarjeta |
| Coste de creación | **cero** — el token se genera sin conexión, al instante |
| Cupo por identidad | **1.000.000 de tokens / hora** (`max: 1000000`, `reset_seconds: 3600` desde `/usage`) |
| Límite de rendimiento real | **por IP de salida**, no por identidad — consulta la tabla a continuación |
| Qué aporta una identidad | resiliencia (enfriamiento + conmutación por error), no rendimiento |
| La unidad que escala | **las salidas**, no las identidades → añade salidas cuando necesites más llamadas/min |

**Medido en una salida** (`deepseek-v4.1-flash:free`, intervalo entre llamadas → éxitos de 6):

| Intervalo | Resultado |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

Cuatro salidas con un intervalo de 2,6 s ≈ **92 llamadas/min** en toda la flota.

> 💡 El nivel gratuito lo establece ptero.pro y puede cambiar. Consulta las cifras en vivo en [ptero.pro](https://ptero.pro) — y deja que la propia puerta de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 5

El catálogo está codificado en el paquete del sitio de ptero (no hay una ruta `/models` en el origen) y cambia sin previo aviso. Tal como se sirve el 2026-10-17:

| Modelo | Llamada como en 9Router | Notas |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ el insignia; medido a través de 9Router (p50 ≈ 2,2 s, p90 ≈ 3,3 s en 12 llamadas espaciadas) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ reportado como el predeterminado del sitio |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` también informa qué ids están `disabled` / en `cooldown_models` — ejecuta `ptero-bulk status` para ver los valores en vivo. Los alias cortos (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) se resuelven todos al id anterior. Si un modelo devuelve 404, vuelve a comprobar el paquete en vivo en lugar de confiar en esta tabla.

## 🧪 Cómo usar la API

ptero no habla chat HTTP simple en el origen — responde con un flujo SSE en su propia ruta. El **shim** de este repositorio lo convierte en una superficie OpenAI normal en **`http://127.0.0.1:8791/v1`**:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

El shim admite `stream`, `tools` (elevados desde el bloque de llamada a herramienta en texto del modelo a `tool_calls` reales) y la fijación de identidad por solicitud: un bearer que coincide con una identidad del pool se enruta a esa identidad exacta; de lo contrario, hace round-robin con 60 s de enfriamiento + conmutación por error.

## 🛠 Inicio rápido

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

`identities.txt` contiene una identidad de 32 caracteres hexadecimales por línea, y solo se escriben en él las identidades que respondieron a una llamada de chat real.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` contiene una identidad de 32 caracteres hexadecimales por línea, y solo se escriben en él las identidades que respondieron a una llamada de chat real.
### 🖱️ El lanzador

Aquí no hay menú interactivo — la CLI es la interfaz y cada tarea es un comando (`mint`, `shim`, `connect`, `probe`, `status`, `limit`). `node src/cli.js` sin tarea imprime el banner PTERO y la lista de tareas, y cada opción también tiene una variable de entorno (`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

El mismo atajo del lanzador registra el pool sin especificar el conector: `node src/launcher.js --connect-9router …` pasa el resto de la línea de comandos a `src/connect-9router.js` y `node src/launcher.js --connect-omniroute …` lo pasa a `src/connect-omniroute.js`; sin ninguna de las dos opciones, solo imprime el banner PTERO.

## ✅ Verificado y funcionando — cada clave se prueba

| Comprobación | Resultado |
| --- | --- |
| creación de identidad | `crypto.randomUUID().replace(/-/g,'')` → un `X-MLP-Guest-Token` de 32 caracteres hexadecimales; instantáneo, sin conexión, sin llamada al servidor |
| extracción de nonce | `GET https://ptero.pro/` incluye `var nonce = "<10 hex>"`; un `403 rest_cookie_invalid_nonce` obliga a volver a extraerlo, nunca está codificado de forma fija |
| prueba en vivo | la identidad debe responder a un `POST /wp-json/mlp/v1/chat-stream` real antes de escribirse en el archivo del pool |
| a través de 9Router | `ptero-bulk probe` — medido p50 ≈ 2,2 s, p90 ≈ 3,3 s en 12 llamadas espaciadas con `deepseek-v4.1-flash:free` |
| archivo del pool | contiene credenciales, aunque sean anónimas — está en git-ignore y este repositorio no incluye ninguna |

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro no tiene registro. Una identidad es un token que *tú* generas y envías como `X-MLP-Guest-Token`; lo único más que necesita una solicitud es el nonce de la REST de WordPress del sitio.

| Paso | Llamada | Notas |
| --- | --- | --- |
| creación | local | `crypto.randomUUID().replace(/-/g,'')` → identidad de 32 caracteres hexadecimales + un nombre para mostrar aleatorio |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`; válido para todos los invitados, cada respuesta devuelve uno nuevo |
| chat | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream` con eventos `phase · activity · progress · thinking · token · done`; `done` incluye `{model_used, usage_tokens, conversation_id}` |
| verificación | la misma llamada | la identidad debe responder a un chat real antes de escribirse en el pool |
| servicio | shim local | elige una identidad por solicitud en una salida reservada durante `PTERO_EXIT_GAP` ms, responde a OpenAI `/v1/chat/completions` |
| enrutamiento | 9Router | el nodo `ptero` apunta al shim; una conexión por identidad |

Otros endpoints: `/status` (estado + modelo predeterminado), `/usage` (el cupo de tokens de la identidad), `/api-keys` (la propia lista de claves de un invitado; vacía en una identidad nueva). El formato exacto del protocolo está en [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## ⚙️ Opciones de la CLI

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| Opción | Significado | Predeterminado |
| --- | --- | --- |
| `--count <n>` | identidades a crear | `10` |
| `--conc <n>` | verificaciones en curso (el pool de salidas regula la tasa) | `5` |
| `--pool <file>` | archivo del pool, una identidad por línea | `identities.txt` |
| `--model <id>` | modelo que usa la llamada de verificación / prueba | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | puerto de escucha / dirección de enlace del shim | `8791` / `127.0.0.1` |
| `--exits <list>` | salidas de egreso: `direct,http://host:port,…` | `$PTERO_EXITS` o `direct` |
| `--gap <ms>` | intervalo mínimo entre dos llamadas en una misma salida | `2600` |
| `--router <url>` / `--router-password <pw>` | base de 9Router / contraseña de inicio de sesión | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | URL base del shim a la que apunta el nodo de 9Router | `http://127.0.0.1:8791/v1` |
| `--n <n>` | conexiones (connect) o llamadas (probe) | `16` / `5` |
| `--tools` / `--dry` | probar con una herramienta de función / mostrar lo que haría `connect` | off / off |

Entorno: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ Detrás de un proxy

ptero **no** necesita ninguna salida en absoluto para funcionar — una conexión directa es suficiente, solo empieza a limitar la tasa antes cuando empujas tráfico. El límite `429 Too many messages` es **por IP de egreso**, así que:

- **directo** (predeterminado) — un solo cupo, suficiente para un shim local o uso ligero.
- **proxy HTTP / SOCKS5** — `--exits direct,http://user:pass@host:port,…` o `PTERO_EXITS`. Las salidas con proxy necesitan el paquete opcional `undici`; si no está presente, esas salidas se omiten con una advertencia y la salida directa sigue sirviendo.
- **Múltiples salidas** — cada salida es su propio cupo. El cliente reserva una salida por solicitud, respeta `--gap` / `PTERO_EXIT_GAP` (2600 ms por defecto), y ante un `429` solo aparca esa salida durante 20 s y reintenta en la siguiente.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**Las identidades compran resiliencia; las salidas compran rendimiento.** Una identidad recién creada recibe 429 al instante mientras una salida está saturada, y en el mismo segundo el mismo modelo responde 200 a través de otra salida.

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `identities.txt` | una identidad verificada de 32 caracteres hexadecimales por línea — en git-ignore (credenciales, aunque sean anónimas) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | el `/v1` compatible con OpenAI sobre un pool verificado |
| `src/connect-9router.js` | nodo de proveedor + una conexión por identidad |
| `src/lib/` | `ptero.js` (extracción de nonce, chat-stream SSE), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | formato de protocolo de ptero.pro, paso a paso |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 Conectar con 9Router

[9Router](https://9router.com) es un router autoalojado compatible con OpenAI (`npm install -g 9router && 9router`, panel en `http://localhost:20128`).

ptero no habla chat HTTP simple, así que el conector apunta el nodo `openai-compatible` de 9Router al **shim** de este repositorio y adjunta **una conexión por identidad del pool** — el `Authorization: Bearer <32-hex>` de cada conexión hace que el shim la enrute a esa identidad exacta:

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

## 🔌 Conectar con OmniRoute

[OmniRoute](https://omniroute.online) es un router autoalojado compatible con OpenAI (`npm install -g omniroute && omniroute`, panel en `http://localhost:20128`).

ptero no habla chat HTTP simple, así que el conector apunta el nodo `openai-compatible` de OmniRoute al **shim** de este repositorio y adjunta **una conexión por identidad del pool** — el `Authorization: Bearer <32-hex>` de cada conexión hace que el shim la enrute a esa identidad exacta:

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

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 Qué ofrece el proveedor | sin registro, sin correo electrónico, sin captcha — 1.000.000 de tokens/hora por identidad, rendimiento determinado por tus salidas |
| 🔑 Qué te da una clave | una clave API limitada a su propia cuenta: los 5 ids de modelo en el endpoint de abajo, con los límites de tu plan. La cuota vive en la **cuenta**, que es exactamente por lo que esta herramienta crea una cuenta por clave |
| 🌐 Forma de la API | Compatible con OpenAI: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 Tus datos | solo se contacta con ptero.pro y el backend de bandeja de entrada que configures; las claves permanecen en tu máquina |

## 🐞 Problemas

Si ptero.pro cambia la forma del nonce, la ruta del chat-stream o los ids de modelo, la herramienta se detiene en ese paso y lo indica. **[Abre un issue](../../issues)** con el comando que ejecutaste y la salida exacta; los PR son bienvenidos.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>