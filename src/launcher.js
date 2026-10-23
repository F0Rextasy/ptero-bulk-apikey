'use strict';

/**
 * PTERO banner launcher — printed by the CLI and the shim.
 *
 * The wordmark below is byte-identical to the fenced banner at the top of
 * README.md (and every i18n/README.<lang>.md) — keep the two in sync.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

/** The two router connectors this repository ships — one flag each, no menu to walk through. */
const ROUTERS = [
  { flag: '--connect-9router', file: 'connect-9router.js', label: 'Connect to 9Router' },
  { flag: '--connect-omniroute', file: 'connect-omniroute.js', label: 'Connect to OmniRoute' },
];

/** `node src/launcher.js --connect-9router|--connect-omniroute <connector args>`. */
function connectRouter(router, rest) {
  console.log('  ' + router.label + ' — register the verified pool into a running router\n');
  const r = spawnSync(process.execPath, [path.join(__dirname, router.file), ...rest], { windowsHide: true, cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    console.log('\n⚠ ' + router.label + ' exited with code ' + r.status);
    process.exit(r.status || 1);
  }
}

const WORDMARK = [
  '██████╗  ████████╗ ███████╗ ██████╗   ██████╗',
  '██╔══██╗ ╚══██╔══╝ ██╔════╝ ██╔══██╗ ██╔═══██╗',
  '██████╔╝    ██║    █████╗   ██████╔╝ ██║   ██║',
  '██╔═══╝     ██║    ██╔══╝   ██╔══██╗ ██║   ██║',
  '██║         ██║    ███████╗ ██║  ██║ ╚██████╔╝',
  '╚═╝         ╚═╝    ╚══════╝ ╚═╝  ╚═╝  ╚═════╝',
];

const TAGLINE = '  bulk ptero.pro identities  ·  deepseek-v4.1-flash  ·  no signup';

const WIDTH = Math.max(...WORDMARK.map((r) => r.length));
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const border = (fill) => (color ? `${DIM}${fill}${RESET}` : fill);

/** The wordmark inside a `╔═…═╗` box, matching the house style. */
function boxedBanner() {
  const line = '═'.repeat(WIDTH);
  return [
    '',
    border('╔' + line + '╗'),
    ...WORDMARK.map((r) => r + ' '.repeat(WIDTH - r.length) + border('║')),
    border('╚' + line + '╝'),
    TAGLINE,
    '',
  ].join('\n');
}

const BANNER = WORDMARK.join('\n');

function showBanner() {
  console.log(boxedBanner());
}

function showCompact() {
  console.log('  P T E R O   b u l k - a p i k e y');
}

module.exports = { showBanner, showCompact, BANNER, WORDMARK, boxedBanner };

/** `node src/cli.js <command> …` from the checkout root (the pool file lives here). */
function cli(args) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'cli.js'), ...args], { windowsHide: true, cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) console.log(`\n⚠ exited with code ${r.status}`);
}

/** The menu is the one-command path: pick 1, type a number, the rest is automatic. */
async function menu() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (question, fallback) =>
    new Promise((resolve) => rl.question(`  ${question} [${fallback}]: `, (answer) => resolve(String(answer).trim() || String(fallback))));
  showBanner();
  console.log('  1) Mint keys      — mint identities, verify each with a live chat call');
  console.log('  2) Status         — upstream /status + this pool identity quota');
  console.log('  3) Probe          — one diagnostic chat call through 9Router');
  console.log('  4) Connect to 9Router — register the pool with a local 9Router');
  console.log('  5) Connect to OmniRoute — register the pool with a local OmniRoute');
  console.log('  q) Quit\n');
  const choice = (await ask('Choose', '1')).toLowerCase();
  if (choice === '1') {
    const n = Math.max(1, parseInt(await ask('How many keys?', 10), 10) || 10);
    rl.close();
    return cli(['mint', '--auto', '--count', String(n)]);
  }
  rl.close();
  if (choice === '2') return cli(['status']);
  if (choice === '3') return cli(['probe']);
  if (choice === '4') return connectRouter(ROUTERS[0], []);
  if (choice === '5') return connectRouter(ROUTERS[1], []);
  return undefined;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const router = ROUTERS.find((r) => argv.includes(r.flag));
  if (router) connectRouter(router, argv.filter((a) => a !== router.flag));
  else if (argv.includes('--help') || argv.includes('-h')) console.log('Interactive launcher: run `node src/launcher.js` and pick a menu item.');
  else menu().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
}
