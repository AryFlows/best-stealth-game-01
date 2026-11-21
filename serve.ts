// Frost Veil — a tiny static file server for play-testing game/ on
// localhost. Node 22, standard library only: `node serve.ts [port]`.
// Serves only files inside game/, never anything above it.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const gameDir = join(repoRoot, 'game');
const port = Number(process.argv[2] || process.env.PORT || 8123);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const file = normalize(join(gameDir, rel));
    if (!file.startsWith(gameDir + '/') && file !== gameDir) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    createReadStream(file).pipe(res);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log('Frost Veil: serving game/ at http://127.0.0.1:' + port + '/index.html');
});
