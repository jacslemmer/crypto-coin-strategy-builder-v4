import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { StorageAdapter } from '../ports.js';

export function createFilesystemR2(rootDir: string): StorageAdapter {
  return {
    async upload(path, data) {
      const fullPath = join(rootDir, path);
      const dir = dirname(fullPath);
      await mkdir(dir, { recursive: true });
      await writeFile(fullPath, data);
      return path; // store key path; actual file exists under rootDir
    },
  };
}








