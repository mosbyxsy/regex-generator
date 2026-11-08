import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist');
const contentTypes = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json',
    '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};
createServer(async (request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname.replace(/^\/regex-generator\//, '/');
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root + sep)) { response.writeHead(404).end(); return; }
    try {
        const body = await readFile(file);
        response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
        response.writeHead(404).end();
    }
}).listen(18373, '127.0.0.1');

