'use strict';

/**
 * Tool calling for ptero.pro.
 *
 * Upstream there is none of it: ptero's request body has no `tools` field and its SSE event
 * set is `phase · activity · progress · thinking · token · done` — no `tool_calls` frame has
 * ever appeared. What the model *does* emit is the call as text:
 *
 *     <tool_call>{"name":"get_weather","arguments":{"city":"Istanbul"}}</tool_call>
 *
 * So this module teaches that convention in the prompt and lifts the block back into real
 * OpenAI `tool_calls`. It runs only when the caller actually sent `tools`, so plain chat is
 * byte-identical to talking to ptero directly.
 */

const crypto = require('crypto');

const OPEN = '<tool_call>';
const CLOSE = '</tool_call>';

/** Prompt preamble that makes the model answer with the block above. */
function toolInstructions(tools) {
  const schema = tools.map((t) => t.function || t);
  return (
    'You can call tools. Available tools (JSON Schema):\n' +
    JSON.stringify(schema) +
    `\n\nTo call one, output exactly:\n${OPEN}{"name":"<tool_name>","arguments":{...}}${CLOSE}\n` +
    'Emit one block per call and nothing else when calling. If no tool is needed, answer normally.'
  );
}

/** Pull `tool_calls` out of the model's text; also returns the text with the blocks removed. */
function parseToolCalls(text) {
  const calls = [];
  const re = new RegExp(`${OPEN}\\s*([\\s\\S]*?)\\s*${CLOSE}`, 'gi');
  let m;
  while ((m = re.exec(text))) {
    const raw = m[1].trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { continue; }
    const list = Array.isArray(parsed) ? parsed : parsed.tool_calls || [parsed];
    for (const call of list) {
      const name = call.name || (call.function && call.function.name);
      if (!name) continue;
      const args = call.arguments !== undefined ? call.arguments : call.function && call.function.arguments;
      calls.push({
        id: 'call_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20),
        type: 'function',
        function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args || {}) },
      });
    }
  }
  return { calls, cleaned: text.replace(re, '').trim() };
}

module.exports = { toolInstructions, parseToolCalls, TOOL_BLOCK_OPEN: OPEN, TOOL_BLOCK_CLOSE: CLOSE };