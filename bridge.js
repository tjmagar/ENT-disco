/**
 * Granola Bridge — reads Granola's local cache and serves the latest
 * meeting transcript over HTTP so the discovery app can poll it.
 *
 * Usage: node bridge.js
 * Keep running in a Terminal tab during your call.
 * Open the app at http://localhost:5173 (run: npm run dev)
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CACHE_PATH = path.join(os.homedir(), 'Library/Application Support/Granola/cache-v6.json');
const PORT = 3001;

function getLatestMeeting() {
  const raw  = fs.readFileSync(CACHE_PATH, 'utf8');
  const data = JSON.parse(raw);
  const state      = data?.cache?.state || {};
  const docs       = state.documents   || {};
  const transcripts = state.transcripts || {};

  // Find most recently created doc that has a transcript
  const sorted = Object.entries(docs)
    .filter(([k]) => transcripts[k] && transcripts[k].length > 0)
    .map(([k, v]) => ({
      id:      k,
      title:   v.title || v.name || 'Untitled',
      created: v.created_at || v.createdAt || '',
    }))
    .sort((a, b) => b.created.localeCompare(a.created));

  if (!sorted.length) return null;

  const latest  = sorted[0];
  const entries = transcripts[latest.id] || [];

  const text = entries
    .filter(e => e.source !== 'system' && e.text && e.is_final)
    .sort((a, b) => (a.start_timestamp || '').localeCompare(b.start_timestamp || ''))
    .map(e => e.text)
    .join(' ');

  return {
    id:         latest.id,
    title:      latest.title,
    transcript: text,
    segments:   entries.filter(e => e.source !== 'system' && e.is_final).length,
    updatedAt:  latest.created,
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/transcript') {
    try {
      const meeting = getLatestMeeting();
      res.end(JSON.stringify(meeting || { error: 'No meetings found' }));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
  } else if (req.url === '/health') {
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.statusCode = 404;
    res.end('{}');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n🎙  Granola bridge running on http://localhost:' + PORT);
  console.log('    Reads most recent Granola meeting transcript');
  console.log('    Keep this running during your call');
  console.log('    Open the app at http://localhost:5173\n');
});
