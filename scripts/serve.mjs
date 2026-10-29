import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('.');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8' };
const port = Number(process.env.PORT || 4173);
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const rel = file.slice(root.length + 1);
    if (!file.startsWith(root + sep) || /^(src|scripts|docs|node_modules|test-results)([\\/]|$)/.test(rel) || !types[extname(file)]) {
      res.writeHead(404, {'Content-Type':types['.html']}); res.end(await readFile('404.html')); return;
    }
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    res.writeHead(200, {'Content-Type':types[extname(file)], 'X-Content-Type-Options':'nosniff'});
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, {'Content-Type':types['.html']}); res.end(await readFile('404.html'));
  }
}).listen(port,'127.0.0.1', () => console.log(`EcoPlan preview ready: http://127.0.0.1:${port}`));
