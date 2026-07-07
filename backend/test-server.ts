import express from 'express';

const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

console.log('[TEST] Starting simple test server on port ' + PORT);
const server = app.listen(PORT, () => {
  console.log('[TEST] Server is listening on port ' + PORT);
});

server.on('error', (err) => {
  console.error('[TEST] Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('[TEST] SIGTERM received');
  process.exit(0);
});
