'use strict';

/**
 * PTERO launcher — ASCII banner with the provider name, printed by the CLI and the shim.
 */

const BANNER = `
██████╗ ███████╗███████╗██████╗  ██████╗
██╔══██╗██╔════╝██╔════╝██╔══██╗██╔═══██╗
██████╔╝█████╗  █████╗  ██████╔╝██║   ██║
██╔═══╝ ██╔══╝  ██╔══╝  ██╔══██╗██║   ██║
██║     ███████╗███████╗██║  ██║╚██████╔╝
╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝

 ██████╗ ██╗   ██╗██╗     ██╗   ██╗
 ██╔══██╗╚██╗ ██╔╝██║     ██║   ██║
 ██████╔╝ ╚████╔╝ ██║     ██║   ██║
 ██╔══██╗  ╚██╔╝  ██║     ██║   ██║
 ██║  ██║   ██║   ███████╗╚██████╔╝
 ╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝

  bulk ptero.pro identities  ·  deepseek-v4.1-flash  ·  no signup
`;

function showBanner() {
  console.log(BANNER);
}

function showCompact() {
  console.log('  P T E R O   b u l k - a p i k e y');
}

module.exports = { showBanner, showCompact, BANNER };

if (require.main === module) {
  showBanner();
}