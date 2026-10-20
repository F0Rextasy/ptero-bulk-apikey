'use strict';

/**
 * PTERO banner launcher — printed by the CLI and the shim.
 *
 * The wordmark below is byte-identical to the fenced banner at the top of
 * README.md (and every i18n/README.<lang>.md) — keep the two in sync.
 */

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
  showBanner();
}
