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

**Crie identidades ptero.pro em massa com chaves de API geradas automaticamente — inferência compatível com OpenAI através de um shim local (deepseek-v4.1-flash e o resto do catálogo) + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Nível gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-5-of-them) · [🧪 Usar a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 Nível gratuito — quanto você recebe

**O ptero.pro não tem registro algum: uma identidade é um token hexadecimal de 32 caracteres que você mesmo gera, então não há nada a pagar e nada para se inscrever.**

| O quê | Valor |
| --- | --- |
| Conta necessária | **Nenhuma** — sem e-mail, sem senha, sem captcha, sem cartão |
| Custo de criação | **zero** — o token é gerado offline, instantaneamente |
| Cota por identidade | **1.000.000 de tokens / hora** (`max: 1000000`, `reset_seconds: 3600` de `/usage`) |
| Limite real de throughput | **por IP de saída**, não por identidade — veja a tabela abaixo |
| O que uma identidade oferece | resiliência (cooldown + failover), não throughput |
| A unidade que escala | **saídas**, não identidades → adicione saídas quando precisar de mais chamadas/min |

**Medido em uma saída** (`deepseek-v4.1-flash:free`, intervalo entre chamadas → sucessos de 6):

| Intervalo | Resultado |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

Quatro saídas com intervalo de 2,6 s ≈ **92 chamadas/min** em toda a frota.

> 💡 O nível gratuito é definido pelo ptero.pro e pode mudar. Confira os números ao vivo em [ptero.pro](https://ptero.pro) — e deixe o próprio gate da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 5

O catálogo está fixado no bundle do site do ptero (não há rota `/models` upstream) e muda sem aviso. Conforme servido em 2026-10-17:

| Modelo | Chamada como no 9Router | Observações |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ o carro-chefe; medido através do 9Router (p50 ≈ 2,2 s, p90 ≈ 3,3 s em 12 chamadas espaçadas) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ reportado como o padrão do site |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` também informa quais ids estão `disabled` / em `cooldown_models` — execute `ptero-bulk status` para ver os valores ao vivo. Aliases curtos (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) todos resolvem para o id acima. Se um modelo retornar 404, verifique novamente o bundle ao vivo em vez de confiar nesta tabela.

## 🧪 Como usar a API

O ptero não fala chat HTTP simples upstream — ele responde um stream SSE em sua própria rota. O **shim** deste repositório transforma isso em uma superfície OpenAI comum em **`http://127.0.0.1:8791/v1`**:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

O shim suporta `stream`, `tools` (elevados do bloco de chamada de ferramenta em texto do modelo para `tool_calls` reais) e fixação de identidade por requisição: um bearer que corresponde a uma identidade do pool é roteado para essa identidade exata, caso contrário faz round-robin com cooldown de 60 s + failover.

## 🛠 Início rápido

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

`identities.txt` contém uma identidade hexadecimal de 32 caracteres por linha, e apenas identidades que responderam a uma chamada de chat real são gravadas nele.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` contém uma identidade hexadecimal de 32 caracteres por linha, e apenas identidades que responderam a uma chamada de chat real são gravadas nele.
### 🖱️ O launcher

Não há menu interativo aqui — a CLI é a interface e cada tarefa é um comando (`mint`, `shim`, `connect`, `probe`, `status`, `limit`). `node src/cli.js` sem tarefa imprime o banner PTERO e a lista de tarefas, e cada flag também tem uma variável de ambiente (`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

O mesmo atalho do launcher registra o pool sem especificar o conector: `node src/launcher.js --connect-9router …` passa o resto da linha de comando para `src/connect-9router.js` e `node src/launcher.js --connect-omniroute …` passa para `src/connect-omniroute.js`; sem nenhuma das flags, ele apenas imprime o banner PTERO.

## ✅ Verificado e funcionando — toda chave é testada

| Verificação | Resultado |
| --- | --- |
| criação de identidade | `crypto.randomUUID().replace(/-/g,'')` → um `X-MLP-Guest-Token` hexadecimal de 32 caracteres; instantâneo, offline, sem chamada ao servidor |
| scrape de nonce | `GET https://ptero.pro/` contém `var nonce = "<10 hex>"`; um `403 rest_cookie_invalid_nonce` força um novo scrape, nunca é fixado no código |
| prova ao vivo | a identidade deve responder a um `POST /wp-json/mlp/v1/chat-stream` real antes de ser gravada no arquivo do pool |
| através do 9Router | `ptero-bulk probe` — medido p50 ≈ 2,2 s, p90 ≈ 3,3 s em 12 chamadas espaçadas em `deepseek-v4.1-flash:free` |
| arquivo do pool | contém credenciais, ainda que anônimas — está no git-ignore e este repositório não inclui nenhuma |

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

O ptero.pro não tem registro. Uma identidade é um token que *você* gera e envia como `X-MLP-Guest-Token`; a única outra coisa que uma requisição precisa é o nonce REST do WordPress do site.

| Etapa | Chamada | Observações |
| --- | --- | --- |
| mint | local | `crypto.randomUUID().replace(/-/g,'')` → identidade hexadecimal de 32 caracteres + um nome de exibição aleatório |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`; válido para todos os guests, toda resposta ecoa um novo |
| chat | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream` com eventos `phase · activity · progress · thinking · token · done`; `done` carrega `{model_used, usage_tokens, conversation_id}` |
| verify | mesma chamada | a identidade deve responder a um chat real antes de ser gravada no pool |
| serve | shim local | escolhe uma identidade por requisição em uma saída reservada por `PTERO_EXIT_GAP` ms, responde OpenAI `/v1/chat/completions` |
| route | 9Router | o nó `ptero` aponta para o shim; uma conexão por identidade |

Outros endpoints: `/status` (saúde + modelo padrão), `/usage` (o bucket de tokens da identidade), `/api-keys` (a própria lista de chaves de um guest; vazia em uma identidade nova). O formato exato do protocolo está em [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## ⚙️ Opções da CLI

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| Flag | Significado | Padrão |
| --- | --- | --- |
| `--count <n>` | identidades a criar | `10` |
| `--conc <n>` | verificações em andamento (o pool de saídas regula a taxa) | `5` |
| `--pool <file>` | arquivo do pool, uma identidade por linha | `identities.txt` |
| `--model <id>` | modelo usado pela chamada de verificação / probe | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | porta de escuta / endereço de bind do shim | `8791` / `127.0.0.1` |
| `--exits <list>` | saídas de egresso: `direct,http://host:port,…` | `$PTERO_EXITS` ou `direct` |
| `--gap <ms>` | intervalo mínimo entre duas chamadas em uma saída | `2600` |
| `--router <url>` / `--router-password <pw>` | base do 9Router / senha de login | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | URL base do shim para onde o nó do 9Router aponta | `http://127.0.0.1:8791/v1` |
| `--n <n>` | conexões (connect) ou chamadas (probe) | `16` / `5` |
| `--tools` / `--dry` | probe com uma ferramenta de função / mostrar o que `connect` faria | off / off |

Ambiente: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ Atrás de um proxy

O ptero **não** precisa de saída alguma para funcionar — uma conexão direta é suficiente, ela apenas começa a limitar a taxa mais cedo quando você aumenta o tráfego. O throttle `429 Too many messages` é **por IP de egresso**, então:

- **direto** (padrão) — um bucket, suficiente para um shim local ou uso leve.
- **proxy HTTP / SOCKS5** — `--exits direct,http://user:pass@host:port,…` ou `PTERO_EXITS`. Saídas via proxy precisam do pacote opcional `undici`; se ele estiver ausente, essas saídas são ignoradas com um aviso e a saída direta continua servindo.
- **Múltiplas saídas** — cada saída é seu próprio bucket. O cliente reserva uma saída por requisição, respeita `--gap` / `PTERO_EXIT_GAP` (padrão 2600 ms) e, em um `429`, estaciona apenas essa saída por 20 s e tenta novamente na próxima.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**Identidades compram resiliência; saídas compram throughput.** Uma identidade recém-criada recebe 429 instantaneamente enquanto uma saída está quente, e no mesmo segundo o mesmo modelo responde 200 por uma saída diferente.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `identities.txt` | uma identidade verificada de 32 caracteres hexadecimais por linha — no git-ignore (credenciais, ainda que anônimas) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | o `/v1` compatível com OpenAI sobre um pool verificado |
| `src/connect-9router.js` | nó de provedor + uma conexão por identidade |
| `src/lib/` | `ptero.js` (scrape de nonce, SSE chat-stream), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | formato de protocolo do ptero.pro, passo a passo |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 Conectar ao 9Router

O [9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI (`npm install -g 9router && 9router`, painel em `http://localhost:20128`).

O ptero não fala chat HTTP simples, então o conector aponta o nó `openai-compatible` do 9Router para o **shim** deste repositório e anexa **uma conexão por identidade do pool** — o `Authorization: Bearer <32-hex>` de cada conexão faz o shim roteá-la para essa identidade exata:

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

## 🔌 Conectar ao OmniRoute

O [OmniRoute](https://omniroute.online) é um roteador auto-hospedado e compatível com OpenAI (`npm install -g omniroute && omniroute`, painel em `http://localhost:20128`).

O ptero não fala chat HTTP simples, então o conector aponta o nó `openai-compatible` do OmniRoute para o **shim** deste repositório e anexa **uma conexão por identidade do pool** — o `Authorization: Bearer <32-hex>` de cada conexão faz o shim roteá-la para essa identidade exata:

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

## 🔑 O que uma chave oferece

| | |
| --- | --- |
| 🏢 Provedor | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 O que o provedor oferece | sem cadastro, sem e-mail, sem captcha — 1.000.000 de tokens/hora por identidade, throughput definido pelas suas saídas |
| 🔑 O que uma chave oferece | uma chave de API vinculada à sua própria conta: os 5 ids de modelo no endpoint abaixo, nos limites do seu plano. A cota fica na **conta**, que é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | Compatível com OpenAI: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 Seus dados | apenas o ptero.pro e o backend de inbox que você configurar são contatados; as chaves permanecem na sua máquina |

## 🐞 Problemas

Se o ptero.pro mudar o formato do nonce, a rota de chat-stream ou os ids de modelo, a ferramenta para nessa etapa e avisa. **[Abra uma issue](../../issues)** com o comando que você executou e a saída exata; PRs são bem-vindos.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>