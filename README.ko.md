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

**자동 생성된 API 키로 ptero.pro 아이덴티티를 대량 발급하세요 — 로컬 shim을 통한 OpenAI 호환 추론(deepseek-v4.1-flash 및 나머지 카탈로그) + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-5-of-them) · [🧪 API 사용법](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 무료 티어 — 얼마나 받을 수 있나

**ptero.pro는 가입 절차가 전혀 없습니다: 아이덴티티는 직접 생성하는 무작위 32-hex 토큰이므로, 지불할 것도 가입할 것도 없습니다.**

| 항목 | 값 |
| --- | --- |
| 필요한 계정 | **없음** — 이메일, 비밀번호, 캡차, 카드 모두 불필요 |
| 발급 비용 | **무료** — 토큰은 오프라인에서 즉시 생성됨 |
| 아이덴티티당 버킷 | **1,000,000 토큰 / 시간** (`/usage` 기준 `max: 1000000`, `reset_seconds: 3600`) |
| 실제 처리량 제한 | 아이덴티티가 아닌 **송신 IP당** — 아래 표 참조 |
| 아이덴티티 하나가 주는 것 | 처리량이 아닌 복원력(쿨다운 + 페일오버) |
| 확장되는 단위 | 아이덴티티가 아닌 **출구(exit)** → 더 많은 호출/분이 필요하면 출구를 추가하세요 |

**하나의 출구에서 측정** (`deepseek-v4.1-flash:free`, 호출 간 간격 → 6회 중 성공 횟수):

| 간격 | 결과 |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

2.6초 간격으로 출구 4개 ≈ 전체 **92 호출/분**.

> 💡 무료 티어는 ptero.pro가 정하며 변경될 수 있습니다. 실시간 수치는 [ptero.pro](https://ptero.pro)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하게 하세요:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 모델 — 5개 전부

카탈로그는 ptero의 사이트 번들에 하드코딩되어 있으며(업스트림 `/models` 라우트가 없음) 예고 없이 변경됩니다. 2026-10-17 기준 제공되는 모델:

| 모델 | 9Router에서 호출하는 이름 | 비고 |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ 주력 모델; 9Router를 통해 측정됨(12회 페이스 조절 호출에서 p50 ≈ 2.2초, p90 ≈ 3.3초) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ 사이트 기본값으로 보고됨 |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status`는 어떤 id가 `disabled` / `cooldown_models`에 있는지도 보고합니다 — `ptero-bulk status`를 실행하면 실시간 값을 볼 수 있습니다. 짧은 별칭(`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …)은 모두 위의 id로 해석됩니다. 모델이 404를 반환하면 이 표를 믿지 말고 실시간 번들을 다시 확인하세요.

## 🧪 API 사용법

ptero는 업스트림에서 일반 HTTP 채팅을 지원하지 않습니다 — 자체 라우트에서 SSE 스트림으로 응답합니다. 이 저장소의 **shim**이 이를 **`http://127.0.0.1:8791/v1`** 에서 평범한 OpenAI 인터페이스로 변환합니다:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

shim은 `stream`, `tools`(모델의 텍스트 도구 호출 블록을 실제 `tool_calls`로 변환) 및 요청별 아이덴티티 고정을 지원합니다: 풀 아이덴티티와 일치하는 bearer는 해당 아이덴티티로 라우팅되고, 그렇지 않으면 60초 쿨다운 + 페일오버와 함께 라운드 로빈됩니다.

## 🛠 빠른 시작

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

`identities.txt`는 한 줄에 하나의 32-hex 아이덴티티를 담고 있으며, 실제 채팅 호출에 응답한 아이덴티티만 기록됩니다.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt`는 한 줄에 하나의 32-hex 아이덴티티를 담고 있으며, 실제 채팅 호출에 응답한 아이덴티티만 기록됩니다.
### 🖱️ 런처

여기에는 대화형 메뉴가 없습니다 — CLI가 인터페이스이며 모든 작업은 하나의 명령입니다(`mint`, `shim`, `connect`, `probe`, `status`, `limit`). 작업 없이 `node src/cli.js`를 실행하면 PTERO 배너와 작업 목록이 출력되며, 모든 플래그에는 환경 변수도 있습니다(`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

같은 런처 단축키로 커넥터를 명시하지 않고도 풀을 등록할 수 있습니다: `node src/launcher.js --connect-9router …`는 나머지 명령줄을 `src/connect-9router.js`로 넘기고, `node src/launcher.js --connect-omniroute …`는 `src/connect-omniroute.js`로 넘깁니다; 어느 플래그도 없으면 PTERO 배너만 출력합니다.

## ✅ 검증됨 — 모든 키가 테스트됨

| 검사 | 결과 |
| --- | --- |
| 아이덴티티 발급 | `crypto.randomUUID().replace(/-/g,'')` → 32-hex `X-MLP-Guest-Token`; 즉시, 오프라인, 서버 호출 없음 |
| nonce 스크래핑 | `GET https://ptero.pro/`에 `var nonce = "<10 hex>"`가 포함됨; `403 rest_cookie_invalid_nonce`가 발생하면 재스크래핑을 강제하며, 절대 하드코딩되지 않음 |
| 실시간 증명 | 아이덴티티가 실제 `POST /wp-json/mlp/v1/chat-stream`에 응답해야 풀 파일에 기록됨 |
| 9Router 통과 | `ptero-bulk probe` — `deepseek-v4.1-flash:free`에서 12회 페이스 조절 호출로 p50 ≈ 2.2초, p90 ≈ 3.3초 측정됨 |
| 풀 파일 | 아무리 익명이라도 자격 증명을 포함함 — git-ignore되며 이 저장소에는 포함되지 않음 |

## 🧭 작동 방식

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro에는 가입 절차가 없습니다. 아이덴티티는 *직접* 생성하여 `X-MLP-Guest-Token`으로 보내는 토큰입니다; 요청에 필요한 다른 하나는 사이트의 WordPress REST nonce입니다.

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 발급 | 로컬 | `crypto.randomUUID().replace(/-/g,'')` → 32-hex 아이덴티티 + 무작위 표시 이름 |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`; 게스트 전체 공용이며, 모든 응답이 새 nonce를 반환함 |
| 채팅 | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream`이며 이벤트는 `phase · activity · progress · thinking · token · done`; `done`은 `{model_used, usage_tokens, conversation_id}`를 담음 |
| 검증 | 동일 호출 | 아이덴티티가 실제 채팅에 응답해야 풀에 기록됨 |
| 서빙 | 로컬 shim | `PTERO_EXIT_GAP` ms 동안 예약된 출구에서 요청별로 아이덴티티를 선택하고, OpenAI `/v1/chat/completions`에 응답 |
| 라우팅 | 9Router | `ptero` 노드가 shim을 가리킴; 아이덴티티당 하나의 연결 |

기타 엔드포인트: `/status`(상태 + 기본 모델), `/usage`(아이덴티티의 토큰 버킷), `/api-keys`(게스트 자신의 키 목록; 새 아이덴티티에서는 비어 있음). 정확한 전송 형식은 [`docs/PROTOCOL.md`](docs/PROTOCOL.md)에 있습니다.

## ⚙️ CLI 옵션

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| 플래그 | 의미 | 기본값 |
| --- | --- | --- |
| `--count <n>` | 발급할 아이덴티티 수 | `10` |
| `--conc <n>` | 동시 검증 수(출구 풀이 속도를 조절함) | `5` |
| `--pool <file>` | 풀 파일, 한 줄에 하나의 아이덴티티 | `identities.txt` |
| `--model <id>` | 검증 / 프로브 호출에 사용할 모델 | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | shim 수신 포트 / 바인드 주소 | `8791` / `127.0.0.1` |
| `--exits <list>` | 송신 출구: `direct,http://host:port,…` | `$PTERO_EXITS` 또는 `direct` |
| `--gap <ms>` | 하나의 출구에서 두 호출 사이의 최소 간격 | `2600` |
| `--router <url>` / `--router-password <pw>` | 9Router 기본 URL / 로그인 비밀번호 | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | 9Router 노드가 가리키는 shim 기본 URL | `http://127.0.0.1:8791/v1` |
| `--n <n>` | 연결 수(connect) 또는 호출 수(probe) | `16` / `5` |
| `--tools` / `--dry` | 함수 도구로 프로브 / `connect`가 수행할 작업 표시 | 꺼짐 / 꺼짐 |

환경 변수: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ 프록시 뒤에서

ptero는 작동하는 데 출구가 **전혀** 필요하지 않습니다 — 직접 연결로 충분하며, 다만 트래픽을 밀어넣으면 더 빨리 속도 제한이 시작될 뿐입니다. `429 Too many messages` 제한은 **송신 IP당** 적용되므로:

- **direct**(기본값) — 버킷 하나, 로컬 shim이나 가벼운 사용에 적합합니다.
- **HTTP / SOCKS5 프록시** — `--exits direct,http://user:pass@host:port,…` 또는 `PTERO_EXITS`. 프록시 출구에는 선택적 `undici` 패키지가 필요합니다; 없으면 해당 출구는 경고와 함께 건너뛰고 direct 출구가 계속 서빙합니다.
- **여러 출구** — 각 출구는 자체 버킷입니다. 클라이언트는 요청당 하나의 출구를 예약하고, `--gap` / `PTERO_EXIT_GAP`(기본 2600 ms)을 준수하며, `429`가 발생하면 해당 출구만 20초 동안 정지시키고 다음 출구에서 재시도합니다.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**아이덴티티는 복원력을, 출구는 처리량을 삽니다.** 새 아이덴티티는 출구가 뜨거울 때 즉시 429를 받지만, 같은 순간 같은 모델이 다른 출구에서는 200으로 응답합니다.

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `identities.txt` | 한 줄에 하나의 검증된 32-hex 아이덴티티 — git-ignore됨(아무리 익명이라도 자격 증명) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | 검증된 풀 위의 OpenAI 호환 `/v1` |
| `src/connect-9router.js` | 프로바이더 노드 + 아이덴티티당 하나의 연결 |
| `src/lib/` | `ptero.js`(nonce 스크래핑, SSE chat-stream), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | ptero.pro 전송 형식, 단계별 |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다(`npm install -g 9router && 9router`, 대시보드는 `http://localhost:20128`).

ptero는 일반 HTTP 채팅을 지원하지 않으므로, 커넥터는 9Router의 `openai-compatible` 노드를 이 저장소의 **shim**으로 향하게 하고 **풀 아이덴티티당 하나의 연결**을 붙입니다 — 각 연결의 `Authorization: Bearer <32-hex>`가 shim으로 하여금 해당 아이덴티티로 라우팅하게 합니다:

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

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅, OpenAI 호환 라우터입니다(`npm install -g omniroute && omniroute`, 대시보드는 `http://localhost:20128`).

ptero는 일반 HTTP 채팅을 지원하지 않으므로, 커넥터는 OmniRoute의 `openai-compatible` 노드를 이 저장소의 **shim**으로 향하게 하고 **풀 아이덴티티당 하나의 연결**을 붙입니다 — 각 연결의 `Authorization: Bearer <32-hex>`가 shim으로 하여금 해당 아이덴티티로 라우팅하게 합니다:

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

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 프로바이더 | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 프로바이더가 제공하는 것 | 가입, 이메일, 캡차 없음 — 아이덴티티당 시간당 1,000,000 토큰, 처리량은 출구에 따라 결정됨 |
| 🔑 키 하나로 얻는 것 | 자체 계정에 한정된 API 키 하나: 아래 엔드포인트의 5개 모델 id를 요금제 한도 내에서 사용. 할당량은 **계정**에 있으므로, 이 도구가 키마다 계정 하나를 생성하는 것입니다 |
| 🌐 API 형태 | OpenAI 호환: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 데이터 | ptero.pro와 설정한 inbox 백엔드만 접속되며; 키는 사용자 컴퓨터에 남습니다 |

## 🐞 이슈

ptero.pro가 nonce 형태, chat-stream 라우트 또는 모델 id를 변경하면, 도구는 해당 단계에서 멈추고 그 사실을 알립니다. 실행한 명령과 정확한 출력을 포함하여 **[이슈를 열어주세요](../../issues)**; PR도 환영합니다.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey 기여자들

</div>