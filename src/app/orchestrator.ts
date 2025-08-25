import { buildTradingViewUrl, computeAnonymizedCropBox, type UsdtPair } from '../domain/tradingview.js';
import type { Capturer, CoinSource, FetchJobParams, IdGenerator, PairResolver, PersistenceAdapter, StorageAdapter, ImageRecord, ProgressLogger } from '../ports.js';

export type FetchJobDeps = {
  source: CoinSource;
  resolver: PairResolver;
  capturer: Capturer;
  storage: StorageAdapter;
  db: PersistenceAdapter;
  ids: IdGenerator;
  now: () => Date;
  logger?: ProgressLogger;
};

export type FetchJobResult = { versionId: string; processedPairs: number };

export async function runFetchJob(
  params: FetchJobParams,
  deps: FetchJobDeps,
): Promise<FetchJobResult> {
  const { source, includeAnonymized, limit } = params;
  const { source: coinSource, resolver, capturer, storage, db, ids, now } = deps;

  const symbols = await coinSource.listTopSymbols({ limit, source });
  const pairs: UsdtPair[] = [];
  for (const symbol of symbols) {
    const pair = await resolver.resolvePreferredUsdtPair(symbol);
    if (pair) pairs.push(pair);
  }

  const createdVersion = await db.createVersion({
    source,
    coinCount: pairs.length,
  });

  let processedPairs = 0;
  await deps.logger?.log(`job:start version=${createdVersion.id} pairs=${pairs.length}`);
  for (const pair of pairs) {
    const url = buildTradingViewUrl({
      exchange: 'BINANCE',
      symbol: pair,
      theme: 'light',
      timeframe: '1D',
      windowDays: 365,
      dropdownClosed: true,
    });
    const full = await capturer.captureFullScreenshot(url);
    const fullPath = `screens/${createdVersion.id}/${pair}/full.png`;
    const storedFullPath = await storage.upload(fullPath, full);
    const _fullImage = await db.insertImage({
      versionId: createdVersion.id,
      type: 'full',
      pair,
      path: storedFullPath,
    });
    void _fullImage;

    if (includeAnonymized) {
      const crop = computeAnonymizedCropBox({ width: 1920, height: 1080 });
      const anon = await capturer.crop(full, crop);
      const anonPath = `screens/${createdVersion.id}/${pair}/anon.png`;
      const storedAnonPath = await storage.upload(anonPath, anon);
      const _anonImage: ImageRecord = await db.insertImage({
        versionId: createdVersion.id,
        type: 'anon',
        pair,
        path: storedAnonPath,
      });
      void _anonImage;
    }

    processedPairs += 1;
    await deps.logger?.log(`job:progress version=${createdVersion.id} pair=${pair} processed=${processedPairs}`);
  }

  void ids;
  void now;
  await deps.logger?.log(`job:complete version=${createdVersion.id} processed=${processedPairs}`);

  return { versionId: createdVersion.id, processedPairs };
}


