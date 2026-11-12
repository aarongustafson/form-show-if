import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = new Map([
	['.css', 'text/css'],
	['.html', 'text/html'],
	['.js', 'text/javascript'],
	['.json', 'application/json'],
]);

createServer(async (request, response) => {
	const pathname = new URL(request.url, 'http://localhost').pathname;
	const requestedPath = resolve(root, `.${pathname}`);
	if (!requestedPath.startsWith(`${resolve(root)}${sep}`)) {
		response.writeHead(403).end();
		return;
	}
	try {
		const file = await stat(requestedPath);
		if (!file.isFile()) {
			response.writeHead(404).end();
			return;
		}
		response.writeHead(200, {
			'content-type':
				types.get(extname(requestedPath)) || 'application/octet-stream',
			'cache-control': 'no-store',
		});
		createReadStream(requestedPath)
			.on('error', (error) => {
				console.error('Unable to stream test fixture:', error);
				response.destroy(error);
			})
			.pipe(response);
	} catch (error) {
		if (error.code === 'ENOENT') {
			response.writeHead(404).end();
		} else {
			console.error('Unable to serve test fixture:', error);
			response.writeHead(500).end();
		}
	}
}).listen(4180, '127.0.0.1');
