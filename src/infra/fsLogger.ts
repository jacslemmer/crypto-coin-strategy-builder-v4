import { mkdir, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { ProgressLogger } from '../ports.js';

export function createFsProgressLogger(filePath: string): ProgressLogger {
	return {
		async log(message: string): Promise<void> {
			const dir = dirname(filePath);
			await mkdir(dir, { recursive: true });
			const line = `${new Date().toISOString()} ${message}\n`;
			await appendFile(filePath, line, { encoding: 'utf8' });
		},
	};
}


