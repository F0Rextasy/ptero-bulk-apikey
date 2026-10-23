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

**Générez en masse des identités ptero.pro avec des clés API auto-générées — inférence compatible OpenAI via un shim local (deepseek-v4.1-flash et le reste du catalogue) + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://ptero.pro)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Niveau gratuit](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-5-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## 🎁 Niveau gratuit — ce que vous obtenez

**ptero.pro n'a aucune inscription : une identité est un jeton aléatoire de 32 caractères hexadécimaux que vous générez vous-même, donc il n'y a rien à payer et rien à quoi s'inscrire.**

| Quoi | Valeur |
| --- | --- |
| Compte requis | **Aucun** — pas d'e-mail, pas de mot de passe, pas de captcha, pas de carte |
| Coût de génération | **zéro** — le jeton est généré hors ligne, instantanément |
| Quota par identité | **1 000 000 de jetons / heure** (`max: 1000000`, `reset_seconds: 3600` depuis `/usage`) |
| Limite de débit réelle | **par IP de sortie**, pas par identité — voir le tableau ci-dessous |
| Ce qu'apporte une identité | la résilience (cooldown + bascule), pas le débit |
| L'unité qui monte en charge | les **sorties**, pas les identités → ajoutez des sorties quand vous avez besoin de plus d'appels/min |

**Mesuré sur une sortie** (`deepseek-v4.1-flash:free`, intervalle entre les appels → succès sur 6) :

| Intervalle | Résultat |
| --- | --- |
| 0 ms | 0 / 6 OK |
| 1000 ms | 2 / 6 OK |
| 2500 ms | 6 / 6 OK |

Quatre sorties avec un intervalle de 2,6 s ≈ **92 appels/min** à l'échelle de la flotte.

> 💡 Le niveau gratuit est défini par ptero.pro et peut changer. Consultez les chiffres en direct sur [ptero.pro](https://ptero.pro) — et laissez le propre contrôle de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 5 au complet

Le catalogue est codé en dur dans le bundle du site de ptero (il n'y a pas de route `/models` en amont) et change sans préavis. Tel que servi le 2026-10-17 :

| Modèle | Appel tel quel dans 9Router | Remarques |
| --- | --- | --- |
| `deepseek-v4.1-flash:free` | `ptero/deepseek-v4.1-flash:free` | ✅ le fer de lance ; mesuré via 9Router (p50 ≈ 2,2 s, p90 ≈ 3,3 s sur 12 appels cadencés) |
| `ling-3.0-flash:free` | `ptero/ling-3.0-flash:free` | ✅ |
| `mistral-nemo:minirouter` | `ptero/mistral-nemo:minirouter` | ✅ |
| `qwen3.7-flash:minirouter` | `ptero/qwen3.7-flash:minirouter` | ✅ signalé comme le modèle par défaut du site |
| `apodex-1.1-mini:free` | `ptero/apodex-1.1-mini:free` | ✅ |

`GET /status` indique aussi quels ids sont `disabled` / dans `cooldown_models` — lancez `ptero-bulk status` pour voir les valeurs en direct. Les alias courts (`ptero/deepseek`, `deepseek`, `ling`, `qwen3.7-flash`, …) se résolvent tous vers l'id ci-dessus. Si un modèle renvoie un 404, revérifiez le bundle en direct plutôt que de vous fier à ce tableau.

## 🧪 Comment utiliser l'API

ptero ne parle pas du chat HTTP simple en amont — il répond par un flux SSE sur sa propre route. Le **shim** de ce dépôt transforme cela en une surface OpenAI ordinaire sur **`http://127.0.0.1:8791/v1`** :

```bash
node src/cli.js shim --pool identities.txt --port 8791
```

```bash
curl http://127.0.0.1:8791/v1/chat/completions \
  -H "Authorization: Bearer <32-hex identity>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash:free","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

Le shim prend en charge `stream`, `tools` (extraits du bloc d'appel d'outil textuel du modèle vers de vrais `tool_calls`) et l'épinglage d'identité par requête : un bearer qui correspond à une identité du pool est routé vers cette identité exacte, sinon il fait du round-robin avec un cooldown de 60 s + bascule.

## 🛠 Démarrage rapide

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

`identities.txt` contient une identité de 32 caractères hexadécimaux par ligne, et seules les identités ayant répondu à un véritable appel de chat y sont écrites.

```bash
# 3) register the pool into a running OmniRoute
node src/cli.js connect --n 16
```

`identities.txt` contient une identité de 32 caractères hexadécimaux par ligne, et seules les identités ayant répondu à un véritable appel de chat y sont écrites.
### 🖱️ Le lanceur

Il n'y a pas de menu interactif ici — la CLI est l'interface et chaque tâche est une seule commande (`mint`, `shim`, `connect`, `probe`, `status`, `limit`). `node src/cli.js` sans tâche affiche la bannière PTERO et la liste des tâches, et chaque option a aussi une variable d'environnement (`PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`).

Le même raccourci du lanceur enregistre le pool sans préciser le connecteur : `node src/launcher.js --connect-9router …` transmet le reste de la ligne de commande à `src/connect-9router.js` et `node src/launcher.js --connect-omniroute …` le transmet à `src/connect-omniroute.js` ; sans aucun de ces drapeaux, il affiche simplement la bannière PTERO.

## ✅ Vérifié fonctionnel — chaque clé est testée

| Vérification | Résultat |
| --- | --- |
| génération d'identité | `crypto.randomUUID().replace(/-/g,'')` → un `X-MLP-Guest-Token` de 32 caractères hexadécimaux ; instantané, hors ligne, aucun appel serveur |
| récupération du nonce | `GET https://ptero.pro/` contient `var nonce = "<10 hex>"` ; un `403 rest_cookie_invalid_nonce` force une nouvelle récupération, il n'est jamais codé en dur |
| preuve en direct | l'identité doit répondre à un véritable `POST /wp-json/mlp/v1/chat-stream` avant d'être écrite dans le fichier de pool |
| via 9Router | `ptero-bulk probe` — mesuré p50 ≈ 2,2 s, p90 ≈ 3,3 s sur 12 appels cadencés sur `deepseek-v4.1-flash:free` |
| fichier de pool | contient des identifiants, aussi anonymes soient-ils — il est ignoré par git et ce dépôt n'en fournit aucun |

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: ptero.pro page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST http://127.0.0.1:8791/v1/chat/completions → real content = the key is live
```

ptero.pro n'a pas d'inscription. Une identité est un jeton que *vous* générez et envoyez comme `X-MLP-Guest-Token` ; la seule autre chose dont une requête a besoin est le nonce REST WordPress du site.

| Étape | Appel | Remarques |
| --- | --- | --- |
| mint | local | `crypto.randomUUID().replace(/-/g,'')` → identité de 32 caractères hexadécimaux + un nom d'affichage aléatoire |
| nonce | `GET https://ptero.pro/` | `var nonce = "<10 hex>"` → `X-WP-Nonce` ; valable pour tous les invités, chaque réponse en renvoie un nouveau |
| chat | `POST /wp-json/mlp/v1/chat-stream` | `200 text/event-stream` avec les événements `phase · activity · progress · thinking · token · done` ; `done` porte `{model_used, usage_tokens, conversation_id}` |
| verify | même appel | l'identité doit répondre à un vrai chat avant d'être écrite dans le pool |
| serve | shim local | choisit une identité par requête sur une sortie réservée pendant `PTERO_EXIT_GAP` ms, répond à `/v1/chat/completions` d'OpenAI |
| route | 9Router | le nœud `ptero` pointe vers le shim ; une connexion par identité |

Autres endpoints : `/status` (santé + modèle par défaut), `/usage` (le seau de jetons de l'identité), `/api-keys` (la propre liste de clés d'un invité ; vide sur une identité fraîche). Le format exact sur le fil est dans [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## ⚙️ Options de la CLI

```bash
ptero-bulk mint --count 250 --conc 16       # bulk mint + verify into identities.txt
ptero-bulk shim --pool identities.txt       # OpenAI-compatible /v1 on :8791
ptero-bulk connect --n 16                   # register into 9Router (one connection per identity)
ptero-bulk probe --n 5 --gap 3000           # end-to-end calls through 9Router
ptero-bulk status                           # upstream /status + a fresh identity's /usage
ptero-bulk limit --k 12                     # prove the throttle is per exit, not per identity
```

| Option | Signification | Défaut |
| --- | --- | --- |
| `--count <n>` | identités à générer | `10` |
| `--conc <n>` | vérifications en cours (le pool de sorties régule le débit) | `5` |
| `--pool <file>` | fichier de pool, une identité par ligne | `identities.txt` |
| `--model <id>` | modèle utilisé par l'appel de vérification / probe | `deepseek-v4.1-flash:free` |
| `--port <n>` / `--host <addr>` | port d'écoute / adresse de liaison du shim | `8791` / `127.0.0.1` |
| `--exits <list>` | sorties de sortie réseau : `direct,http://host:port,…` | `$PTERO_EXITS` ou `direct` |
| `--gap <ms>` | intervalle minimum entre deux appels sur une même sortie | `2600` |
| `--router <url>` / `--router-password <pw>` | base 9Router / mot de passe de connexion | `http://127.0.0.1:20128` / `123456` |
| `--shim <url>` | URL de base du shim vers laquelle pointe le nœud 9Router | `http://127.0.0.1:8791/v1` |
| `--n <n>` | connexions (connect) ou appels (probe) | `16` / `5` |
| `--tools` / `--dry` | probe avec un outil de fonction / afficher ce que ferait `connect` | off / off |

Environnement : `PTERO_EXITS`, `PTERO_EXIT_GAP`, `PTERO_BASE`, `PTERO_HOME`, `PORT`, `N9ROUTER`, `N9ROUTER_PW`, `N9ROUTER_KEY`.

## 🛰️ Derrière un proxy

ptero n'a besoin d'**aucune** sortie pour fonctionner — une connexion directe suffit, elle commence simplement à limiter le débit plus tôt dès que vous poussez du trafic. La limitation `429 Too many messages` est **par IP de sortie**, donc :

- **direct** (défaut) — un seul seau, suffisant pour un shim local ou un usage léger.
- **proxy HTTP / SOCKS5** — `--exits direct,http://user:pass@host:port,…` ou `PTERO_EXITS`. Les sorties via proxy nécessitent le paquet optionnel `undici` ; s'il est absent, ces sorties sont ignorées avec un avertissement et la sortie directe sert toujours.
- **Plusieurs sorties** — chaque sortie est son propre seau. Le client réserve une sortie par requête, respecte `--gap` / `PTERO_EXIT_GAP` (2600 ms par défaut), et sur un `429` met en pause uniquement cette sortie pendant 20 s puis réessaie sur la suivante.

```bash
PTERO_EXITS=direct,http://127.0.0.1:40000,http://proxy-b:8080 PTERO_EXIT_GAP=2600 node src/cli.js shim
```

**Les identités apportent la résilience ; les sorties apportent le débit.** Une identité toute nouvelle reçoit un 429 instantanément tant qu'une sortie est saturée, et la même seconde le même modèle répond 200 via une autre sortie.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `identities.txt` | une identité vérifiée de 32 caractères hexadécimaux par ligne — ignoré par git (identifiants, aussi anonymes soient-ils) |
| `src/cli.js` | `mint · shim · connect · probe · status · limit` |
| `src/shim.js` | le `/v1` compatible OpenAI sur un pool vérifié |
| `src/connect-9router.js` | nœud fournisseur + une connexion par identité |
| `src/lib/` | `ptero.js` (récupération du nonce, chat-stream SSE), `identity.js`, `pool.js`, `exits.js`, `tools.js`, `models.js` |
| `docs/PROTOCOL.md` | format sur le fil de ptero.pro, étape par étape |
| `examples/` | `mint-and-chat.js`, `shim-and-router.js` |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI (`npm install -g 9router && 9router`, tableau de bord sur `http://localhost:20128`).

ptero ne parle pas du chat HTTP simple, donc le connecteur pointe le nœud `openai-compatible` de 9Router vers le **shim** de ce dépôt et attache **une connexion par identité du pool** — l'en-tête `Authorization: Bearer <32-hex>` de chaque connexion fait que le shim la route vers cette identité exacte :

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

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI (`npm install -g omniroute && omniroute`, tableau de bord sur `http://localhost:20128`).

ptero ne parle pas du chat HTTP simple, donc le connecteur pointe le nœud `openai-compatible` d'OmniRoute vers le **shim** de ce dépôt et attache **une connexion par identité du pool** — l'en-tête `Authorization: Bearer <32-hex>` de chaque connexion fait que le shim la route vers cette identité exacte :

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

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **ptero.pro** — [ptero.pro](https://ptero.pro) |
| 🎁 Ce que le fournisseur offre | pas d'inscription, pas d'e-mail, pas de captcha — 1 000 000 de jetons/heure par identité, débit défini par vos sorties |
| 🔑 Ce qu'une clé vous apporte | une clé API limitée à son propre compte : les 5 ids de modèles sur l'endpoint ci-dessous, aux limites de votre offre. Le quota vit sur le **compte**, ce qui explique précisément pourquoi cet outil crée un compte par clé |
| 🌐 Forme de l'API | compatible OpenAI : `POST http://127.0.0.1:8791/v1/chat/completions` |
| 🔒 Vos données | seuls ptero.pro et le backend de boîte de réception que vous configurez sont contactés ; les clés restent sur votre machine |

## 🐞 Problèmes

Si ptero.pro change la forme du nonce, la route chat-stream ou les ids de modèles, l'outil s'arrête à cette étape et le signale. **[Ouvrez un ticket](../../issues)** avec la commande que vous avez lancée et la sortie exacte ; les PR sont bienvenues.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 ptero-bulk-apikey contributors

</div>