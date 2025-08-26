import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer } from '../../src/server.js';
let server;
const getPort = (s) => {
    const addr = s.address();
    if (typeof addr === 'string') {
        const last = addr.split(':').pop();
        return last ? Number(last) : 4000;
    }
    if (addr && typeof addr.port === 'number') {
        return addr.port;
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
        const json = await res.json();
        expect(json.status).toBe('healthy');
    });
    it('pairs endpoint returns data', async () => {
        const port = getPort(server);
        const base = new URL(`http://127.0.0.1:${port}`);
        const res = await fetch(new URL('/api/pairs', base).toString(), {
            headers: { 'Authorization': 'Bearer dev-api-key-12345' }
        });
        expect(res.status).toBe(200);
        const json = await res.json();
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
//# sourceMappingURL=server.test.js.map