import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';

import type { ServerDeps } from '../../src/app/types.js';
import { startServer } from '../../src/server.js';

let server: ReturnType<typeof startServer>;
const getPort = (s: ReturnType<typeof startServer>): number => {
	const addr = s.address();
	if (typeof addr === 'string') {
		const last = addr.split(':').pop();
		return last ? Number(last) : 4000;
	}
	if (addr && typeof (addr as AddressInfo).port === 'number') {
		return (addr as AddressInfo).port;
	}
	return 4000;
};

describe('Express server API endpoints', () => {
	beforeAll(async () => {
		process.env.NODE_ENV = 'development';
		server = startServer(0);
	});
	afterAll(() => {
		server.close();
	});

	it('health check endpoint works', async () => {
		const port = getPort(server);
		const base = new URL(`http://127.0.0.1:${port}`);
		const res = await fetch(new URL('/health', base).toString());
		expect(res.status).toBe(200);
		const json = await res.json() as { status: string };
		expect(json.status).toBe('healthy');
	});

	it('pairs endpoint returns data', async () => {
		const port = getPort(server);
		const base = new URL(`http://127.0.0.1:${port}`);
		const res = await fetch(new URL('/api/pairs', base).toString(), {
			headers: { 'Authorization': 'Bearer dev-api-key-12345' }
		});
		expect(res.status).toBe(200);
		const json = await res.json() as { pairs: any[]; pagination: any };
		expect(Array.isArray(json.pairs)).toBe(true);
		expect(json.pagination).toBeDefined();
	});

	it('returns 404 for unknown route', async () => {
		const port = getPort(server);
		const base = new URL(`http://127.0.0.1:${port}`);
		const res = await fetch(new URL('/nope', base).toString(), { method: 'GET' });
		expect(res.status).toBe(404);
	});

	it('returns 401 for unauthorized API access', async () => {
		const port = getPort(server);
		const base = new URL(`http://127.0.0.1:${port}`);
		const res = await fetch(new URL('/api/pairs', base).toString());
		expect(res.status).toBe(401);
	});

	it('returns 500 on invalid JSON body', async () => {
		const port = getPort(server);
		const base = new URL(`http://127.0.0.1:${port}`);
		const res = await fetch(new URL('/api/pairs', base).toString(), {
			method: 'POST',
			headers: { 
				'content-type': 'application/json',
				'Authorization': 'Bearer dev-api-key-12345'
			},
			body: '{',
		});
		expect(res.status).toBe(500);
	});
});


