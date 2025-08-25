/* eslint-disable import/order */
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';
import { createFilesystemR2 } from '../../src/infra/r2.js';

function u8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe('createFilesystemR2', () => {
  it('uploads to filesystem under root dir', async () => {
    const root = await mkdtemp(join(tmpdir(), 'r2-'));
    const r2 = createFilesystemR2(root);
    const key = 'screens/vX/BTCUSDT/full.png';
    await r2.upload(key, u8('data'));
    const content = await readFile(join(root, key), 'utf8');
    expect(content).toBe('data');
  });
});


