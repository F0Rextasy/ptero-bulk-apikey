'use strict';

/**
 * ptero.pro model catalogue.
 *
 * There is no `/models` route upstream: the ids are hardcoded in the site bundle, and they
 * change without notice. The list below is what `/status` and the site served on 2026-10-17 —
 * `glm-5.3-flash` and `gpt-oss-20b` were already gone by then, and `/status` reported
 * `default_model: qwen3.7-flash:minirouter`.
 */

const MODELS = [
  'deepseek-v4.1-flash:free',
  'ling-3.0-flash:free',
  'mistral-nemo:minirouter',
  'qwen3.7-flash:minirouter',
  'apodex-1.1-mini:free',
];

const DEFAULT_MODEL = 'deepseek-v4.1-flash:free';

/** Short names the shim accepts as aliases of a catalogue id. */
const ALIASES = {
  deepseek: 'deepseek-v4.1-flash:free',
  'deepseek-v4.1-flash': 'deepseek-v4.1-flash:free',
  ling: 'ling-3.0-flash:free',
  'ling-3.0-flash': 'ling-3.0-flash:free',
  mistral: 'mistral-nemo:minirouter',
  'mistral-nemo': 'mistral-nemo:minirouter',
  qwen: 'qwen3.7-flash:minirouter',
  'qwen3.7-flash': 'qwen3.7-flash:minirouter',
  apodex: 'apodex-1.1-mini:free',
  'apodex-1.1-mini': 'apodex-1.1-mini:free',
};

/**
 * Map any caller-supplied name onto a live catalogue id.
 * `ptero/deepseek`, `deepseek-v4.1-flash:free` and `deepseek` all resolve to the same id.
 */
function resolveModel(name) {
  if (!name) return DEFAULT_MODEL;
  const bare = String(name).replace(/^ptero\//, '').trim();
  if (MODELS.includes(bare)) return bare;
  return ALIASES[bare] || DEFAULT_MODEL;
}

module.exports = { MODELS, ALIASES, DEFAULT_MODEL, resolveModel };