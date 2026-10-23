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

if (require.main === module) {
  const argv = process.argv.slice(2);
  const router = ROUTERS.find((r) => argv.includes(r.flag));
  if (router) connectRouter(router, argv.filter((a) => a !== router.flag));
  else showBanner();
}
