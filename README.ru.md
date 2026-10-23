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

**Массовое создание идентичностей ptero.pro с автоматически сгенерированными API-ключами — вывод, совместимый с OpenAI, через локальный shim (deepseek-v4.1-flash и остальной каталог) + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-5-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 Бесплатный тариф — сколько вы получаете

**В ptero.pro вообще нет регистрации: идентичность — это случайный 32-символьный hex-токен, который вы генерируете сами, так что платить не за что и регистрироваться негде.**

| Что | Значение |
| --- | --- |
| Требуется аккаунт | **Нет** — ни e-mail, ни пароля, ни капчи, ни карты |
| Стоимость создания | **ноль** — токен генерируется офлайн, мгновенно |
| Лимит на идентичность | **1 000 000 токенов / час** (`max: 1000000`, `reset_seconds: 3600` из `/usage`) |
| Реальный лимит пропускной способности | **на исходящий IP**, а не на идентичность — см. таблицу ниже |
| Что даёт одна идентичность | устойчивость (cooldown + failover), а не пропускную способность |
| Единица масштабирования | **выходы (exits)**, а не идентичности → добавляйте выходы, когда нужно больше вызовов/мин |

**Измерено на одном выходе** (`deepseek-v4.1-flash:free`, интервал между вызовами → успешных из 6):

| Интервал | Результат |
| --- | --- |
| 0 мс | 0 / 6 OK |
| 1000 мс | 2 / 6 OK |
| 2500 мс | 6 / 6 OK |

Четыре выхода с интервалом 2,6 с ≈ **92 вызова/мин** для всего пула.

> 💡 Бесплатный тариф задаётся ptero.pro и может измениться. Проверяйте актуальные цифры на [ptero.pro](https://ptero.pro) — и пусть решение принимает собственный гейт инструмента:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Модели — все 5

Каталог жёстко прописан в бандле сайта ptero (маршрута `/models` на стороне сервера нет) и меняется без предупреждения. По состоянию на 2026-10-17:

| Модель | Вызов как в 9Router | Примечания |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ флагман; измерено через 9Router (p50 ≈ 2,2 с, p90 ≈ 3,3 с на 12 вызовах с интервалом) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ указана как модель по умолчанию на сайте |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` также сообщает, какие id находятся в состоянии `disabled` / в `cooldown_models` — запустите `ptero-bulk status`, чтобы увидеть актуальные значения. Короткие псевдонимы (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) все разрешаются в указанные выше id. Если модель возвращает 404, перепроверьте актуальный бандл, а не доверяйте этой таблице.

## 🧪 Как использовать API

ptero не поддерживает обычный HTTP-чат на стороне сервера — он отвечает SSE-потоком по своему собственному маршруту. **Shim** из этого репозитория превращает это в обычную поверхность OpenAI на **`http://127.0.0.1:8791/v1`**:

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

Shim поддерживает `stream`, `tools` (преобразует текстовый блок вызова инструментов модели в настоящие `tool_calls`) и привязку идентичности на запрос: bearer, совпадающий с идентичностью из пула, направляется именно к этой идентичности, иначе используется round-robin с 60-секундным cooldown + failover.

## 🛠 Быстрый старт

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

`identities.txt` содержит по одной 32-символьной hex-идентичности на строку, и в него записываются только те идентичности, которые ответили на реальный вызов чата.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` содержит по одной 32-символьной hex-идентичности на строку, и в него записываются только те идентичности, которые ответили на реальный вызов чата.
### 🖱️ Лаунчер

Здесь нет интерактивного меню — интерфейсом служит CLI, и каждая задача выполняется одной командой (`mint`, `shim`, `connect`, `probe`, `status`, `limit`). `node src/cli.js` без задачи выводит баннер PTERO и список задач, а у каждого флага также есть переменная окружения (`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

Тот же ярлык лаунчера регистрирует пул без явного указания коннектора: `node src/launcher.js --connect-9router …` передаёт остаток командной строки в `src/connect-9router.js`, а `node src/launcher.js --connect-omniroute …` передаёт его в `src/connect-omniroute.js`; без обоих флагов он просто выводит баннер PTERO.

## ✅ Проверено в работе — каждый ключ протестирован

| Проверка | Результат |
| --- | --- |
| создание идентичности | `crypto.randomUUID().replace(/-/g,'')` → 32-символьный hex `X-MLP-Guest-Token`; мгновенно, офлайн, без обращения к серверу |
| получение nonce | `GET https://ptero.pro/` содержит `var nonce = "<10 hex>"`; ошибка `403 rest_cookie_invalid_nonce` вызывает повторное получение, он никогда не прописан жёстко |
| живое подтверждение | идентичность должна ответить на реальный `POST /wp-json/mlp/v1/chat-stream`, прежде чем она будет записана в файл пула |
| через 9Router | `ptero-bulk probe` — измерено p50 ≈ 2,2 с, p90 ≈ 3,3 с на 12 вызовах с интервалом на `deepseek-v4.1-flash:free` |
| файл пула | содержит учётные данные, пусть и анонимные — он в git-ignore, и этот репозиторий не поставляет ни одного |

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

В ptero.pro нет регистрации. Идентичность — это токен, который *вы* генерируете и отправляете как `X-MLP-Guest-Token`; единственное, что ещё нужно запросу, — это WordPress REST nonce сайта.

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| создание | локально | `crypto.randomUUID().replace(/-/g,'')` → 32-символьная hex-идентичность + случайное отображаемое имя |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce`; общий для гостей, каждый ответ возвращает новый |
| чат | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream` с событиями `phase · activity · progress · thinking · token · done`; `done` несёт `{model_used, usage_tokens, conversation_id}` |
| проверка | тот же вызов | идентичность должна ответить на реальный чат, прежде чем она будет записана в пул |
| обслуживание | локальный shim | выбирает идентичность на запрос на выходе, зарезервированном на `PTERO_EXIT_GAP` мс, отвечает на OpenAI `/v1/chat/completions` |
| маршрутизация | 9Router | узел `ptero` указывает на shim; одно соединение на идентичность |

Другие эндпоинты: `/status` (состояние + модель по умолчанию), `/usage` (корзина токенов идентичности), `/api-keys` (собственный список ключей гостя; пуст для новой идентичности). Точный формат передачи описан в [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## ⚙️ Опции CLI

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| Флаг | Значение | По умолчанию |
| --- | --- | --- |
| `--count <n>` | сколько идентичностей создать | `10` |
| `--conc <n>` | одновременных проверок (пул выходов задаёт темп) | `5` |
| `--pool <file>` | файл пула, по одной идентичности на строку | `identities.txt` |
| `--model <id>` | модель, используемая для проверки / probe-вызова | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | порт прослушивания shim / адрес привязки | `8791` / `127.0.0.1` |
| `--exits <list>` | исходящие выходы: `direct,http://host:port,…` | `$PTERO_EXITS` или `direct` |
| `--gap <ms>` | минимальный интервал между двумя вызовами на одном выходе | `2600` |
| `--router <url>` / `--router-password <pw>` | база 9Router / пароль для входа | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | базовый URL shim, на который указывает узел 9Router | `http://127.0.0.1:8791/v1` |
| `--n <n>` | соединения (connect) или вызовы (probe) | `16` / `5` |
| `--tools` / `--dry` | probe с функциональным инструментом / показать, что сделал бы `connect` | выкл / выкл |

Переменные окружения: `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ За прокси

ptero **не** требует выхода для работы — прямое соединение подходит, просто оно начинает ограничивать скорость раньше, как только вы увеличиваете трафик. Ограничение `429 Too many messages` действует **на исходящий IP**, поэтому:

- **direct** (по умолчанию) — одна корзина, подходит для локального shim или лёгкого использования.
- **HTTP / SOCKS5 прокси** — `--exits direct,http://user:pass@host:port,…` или `PTERO_EXITS`. Прокси-выходы требуют опционального пакета `undici`; если он отсутствует, эти выходы пропускаются с предупреждением, а прямой выход продолжает обслуживать.
- **Несколько выходов** — каждый выход имеет свою корзину. Клиент резервирует один выход на запрос, соблюдает `--gap` / `PTERO_EXIT_GAP` (по умолчанию 2600 мс), а при `429` приостанавливает только этот выход на 20 с и повторяет на следующем.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**Идентичности дают устойчивость; выходы дают пропускную способность.** Совершенно новая идентичность мгновенно получает 429, пока выход перегружен, и в ту же секунду та же модель отвечает 200 через другой выход.

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `identities.txt` | по одной проверенной 32-символьной hex-идентичности на строку — в git-ignore (учётные данные, пусть и анонимные) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | совместимый с OpenAI `/v1` поверх проверенного пула |
| `src/connect-9router.js` | узел провайдера + одно соединение на идентичность |
| `src/lib/` | `ptero.js` (получение nonce, SSE chat-stream), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | формат передачи ptero.pro, шаг за шагом |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый, совместимый с OpenAI роутер (`npm install -g 9router && 9router`, панель управления на `http://localhost:20128`).

ptero не поддерживает обычный HTTP-чат, поэтому коннектор направляет узел `openai-compatible` 9Router на **shim** этого репозитория и прикрепляет **одно соединение на каждую идентичность пула** — `Authorization: Bearer <32-hex>` каждого соединения заставляет shim направлять его именно к этой идентичности:

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

## 🔌 Подключение к OmniRoute

[OmniRoute](https://omniroute.online) — это самостоятельно размещаемый, совместимый с OpenAI роутер (`npm install -g omniroute && omniroute`, панель управления на `http://localhost:20128`).

ptero не поддерживает обычный HTTP-чат, поэтому коннектор направляет узел `openai-compatible` OmniRoute на **shim** этого репозитория и прикрепляет **одно соединение на каждую идентичность пула** — `Authorization: Bearer <32-hex>` каждого соединения заставляет shim направлять его именно к этой идентичности:

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

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 Что даёт провайдер | без регистрации, без e-mail, без капчи — 1 000 000 токенов/час на идентичность, пропускная способность определяется вашими выходами |
| 🔑 Что даёт один ключ | один API-ключ, привязанный к своему аккаунту: 5 id моделей на эндпоинте ниже, в пределах лимитов вашего тарифа. Квота живёт на **аккаунте**, и именно поэтому этот инструмент создаёт по одному аккаунту на ключ |
| 🌐 Форма API | Совместим с OpenAI: `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 Ваши данные | связь только с ptero.pro и настроенным вами бэкендом inbox; ключи остаются на вашей машине |

## 🐞 Проблемы

Если ptero.pro изменит форму nonce, маршрут chat-stream или id моделей, инструмент остановится на этом шаге и сообщит об этом. **[Откройте issue](../../issues)** с командой, которую вы запустили, и точным выводом; PR приветствуются.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>