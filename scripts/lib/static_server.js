/* Shared static file server for the local test suites.
 * Serves the repo root on an ephemeral port (or a fixed one) and returns
 * { server, url, close } so each Playwright/Node test is fully self-contained.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..');
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.xml': 'application/xml', '.xsl': 'application/xml',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.vcf': 'text/vcard', '.txt': 'text/plain'
};

function startServer(port) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port || 0, '127.0.0.1', () => {
      resolve({
        server: server,
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise(r => server.close(() => r()))
      });
    });
  });
}

module.exports = { startServer, ROOT };
