'use strict';

/**
 * Start the OpenAI-compatible shim over an identity pool and talk to it like any OpenAI
 * endpoint. Run the 9Router half (`node src/connect-9router.js`) to plug it into a router.
 *
 *   node examples/shim-and-router.js [pool-file] [port]
 *
 * The port defaults to 8791 and can also be set with PTERO_SHIM_PORT.
 */

const { startShim } = require('../src/shim.js');
const { MODELS } = require('../src/lib/models.js');

(async () => {
  const poolFile = process.argv[2] || 'identities.txt';
  const port = Number(process.argv[3] || process.env.PTERO_SHIM_PORT || 8791);

  const { url, pool, server } = await startShim({ port, poolFile });
  console.log(`shim on ${url} — pool=${pool.size}, catalogue: ${MODELS.join(', ')}`);

  const health = await (await fetch(url.replace(/\/v1$/, '') + '/health')).json();
  console.log('health:', JSON.stringify(health));

  // Blocking request. No bearer → the pool round-robins.
  const blocking = await fetch(url + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'ptero/deepseek-v4.1-flash:free',
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
      max_tokens: 16,
    }),
  });
  const done = await blocking.json();
  console.log('blocking →', JSON.stringify(done.choices[0].message.content), '·', JSON.stringify(done.ptero));

  // Streaming request.
  const stream = await fetch(url + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'ptero/deepseek-v4.1-flash:free',
      messages: [{ role: 'user', content: 'Say hello in three words.' }],
      stream: true,
    }),
  });
  let text = '';
  for (const line of (await stream.text()).split('\n')) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try { text += JSON.parse(payload).choices?.[0]?.delta?.content || ''; } catch { /* partial frame */ }
  }
  console.log('streaming →', JSON.stringify(text.trim()));

  server.close();
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});