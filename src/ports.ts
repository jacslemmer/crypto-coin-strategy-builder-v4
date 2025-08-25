import type { CropBox, UsdtPair } from './domain/tradingview.js';

export type FetchJobParams = {
  limit: number;
  source: 'cmc' | 'cg' | 'both';
  includeAnonymized: boolean;
};

export type VersionRecord = {
  id: string;
  source: 'cmc' | 'cg' | 'both';
  createdAt: string; // ISO
  coinCount: number;
};

export type ImageRecord = {
  id: string;
  versionId: string;
  type: 'full' | 'anon';
  pair: UsdtPair;
  capturedAt: string; // ISO
  path: string;
  thumbPath?: string;
};

export interface CoinSource {
  listTopSymbols(params: { limit: number; source: 'cmc' | 'cg' | 'both' }): Promise<string[]>;
}

export interface PairResolver {
  resolvePreferredUsdtPair(symbol: string): Promise<UsdtPair | null>;
}

export interface Capturer {
  captureFullScreenshot(url: string): Promise<Uint8Array>;
  crop(buffer: Uint8Array, cropBox: CropBox): Promise<Uint8Array>;
}

export interface StorageAdapter {
  upload(path: string, data: Uint8Array): Promise<string>; // returns stored path or URL
  download?(path: string): Promise<Uint8Array | null>; // optional: download data
  delete?(path: string): Promise<boolean>; // optional: delete file
  exists?(path: string): Promise<boolean>; // optional: check if file exists
  getMetadata?(path: string): Promise<Record<string, any> | null>; // optional: get file metadata
  list?(prefix?: string, limit?: string): Promise<string[]>; // optional: list files
}

export interface PersistenceAdapter {
  createVersion(record: Omit<VersionRecord, 'id' | 'createdAt'>): Promise<VersionRecord>;
  insertImage(record: Omit<ImageRecord, 'id' | 'capturedAt'>): Promise<ImageRecord>;
}

export interface IdGenerator {
  generateId(): string;
}

export interface ProgressLogger {
  log(message: string): Promise<void>;
}
