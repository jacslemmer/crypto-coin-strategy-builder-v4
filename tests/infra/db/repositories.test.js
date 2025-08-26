import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLocalConnection } from '../../../src/infra/db/connection.js';
import { DatabaseRepository } from '../../../src/infra/db/repositories.js';
import { createTables } from '../../../src/infra/db/migrate.js';
describe('Database Repositories', () => {
    let dbPath;
    let db;
    let repo;
    beforeEach(async () => {
        dbPath = await mkdtemp(join(tmpdir(), 'db-test-'));
        const dbFile = join(dbPath, 'test.db');
        db = createLocalConnection(dbFile);
        await createTables(db);
        repo = new DatabaseRepository(db);
    });
    afterEach(async () => {
        const fs = await import('node:fs/promises');
        try {
            await fs.unlink(dbPath);
        }
        catch {
        }
    });
    describe('Pairs Repository', () => {
        it('should create a new pair', async () => {
            const pairData = {
                id: 'pair-1',
                symbol: 'BTCUSDT',
                rank: 1,
                marketCap: 1000000000,
                volume24h: 50000000,
                price: 50000,
                priceChange24h: 1000,
                priceChangePercent24h: 2.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const result = await repo.pairs.create(pairData);
            expect(result.id).toBe('pair-1');
            expect(result.symbol).toBe('BTCUSDT');
            expect(result.rank).toBe(1);
        });
        it('should find pair by symbol', async () => {
            const pairData = {
                id: 'pair-1',
                symbol: 'ETHUSDT',
                rank: 2,
                marketCap: 500000000,
                volume24h: 25000000,
                price: 3000,
                priceChange24h: 50,
                priceChangePercent24h: 1.7,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await repo.pairs.create(pairData);
            const found = await repo.pairs.findBySymbol('ETHUSDT');
            expect(found).toBeDefined();
            expect(found?.symbol).toBe('ETHUSDT');
        });
        it('should find top pairs by market cap', async () => {
            const pairs = [
                {
                    id: 'pair-1',
                    symbol: 'BTCUSDT',
                    rank: 1,
                    marketCap: 1000000000,
                    volume24h: 50000000,
                    price: 50000,
                    priceChange24h: 1000,
                    priceChangePercent24h: 2.0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'pair-2',
                    symbol: 'ETHUSDT',
                    rank: 2,
                    marketCap: 500000000,
                    volume24h: 25000000,
                    price: 3000,
                    priceChange24h: 50,
                    priceChangePercent24h: 1.7,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            for (const pair of pairs) {
                await repo.pairs.create(pair);
            }
            const topPairs = await repo.pairs.findTopByMarketCap(2);
            expect(topPairs).toHaveLength(2);
            expect(topPairs[0]?.symbol).toBe('BTCUSDT');
            expect(topPairs[1]?.symbol).toBe('ETHUSDT');
        });
    });
    describe('Charts Repository', () => {
        let pairId;
        beforeEach(async () => {
            const pair = await repo.pairs.create({
                id: 'pair-1',
                symbol: 'BTCUSDT',
                rank: 1,
                marketCap: 1000000000,
                volume24h: 50000000,
                price: 50000,
                priceChange24h: 1000,
                priceChangePercent24h: 2.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            pairId = pair.id;
        });
        it('should create a new chart', async () => {
            const chartData = {
                id: 'chart-1',
                pairId,
                pairSymbol: 'BTCUSDT',
                originalChartPath: '/charts/btc-original.png',
                anonymizedChartPath: null,
                capturedAt: new Date().toISOString(),
                viewportWidth: 1920,
                viewportHeight: 1080,
                exchange: 'Binance',
                timeframe: '1D',
                theme: 'dark',
                windowDays: 365,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const result = await repo.charts.create(chartData);
            expect(result.id).toBe('chart-1');
            expect(result.pairId).toBe(pairId);
            expect(result.originalChartPath).toBe('/charts/btc-original.png');
        });
        it('should find charts by pair ID', async () => {
            const chartData = {
                id: 'chart-1',
                pairId,
                pairSymbol: 'BTCUSDT',
                originalChartPath: '/charts/btc-original.png',
                anonymizedChartPath: null,
                capturedAt: new Date().toISOString(),
                viewportWidth: 1920,
                viewportHeight: 1080,
                exchange: 'Binance',
                timeframe: '1D',
                theme: 'dark',
                windowDays: 365,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await repo.charts.create(chartData);
            const charts = await repo.charts.findByPairId(pairId);
            expect(charts).toHaveLength(1);
            expect(charts[0]?.pairId).toBe(pairId);
        });
        it('should update anonymized chart path', async () => {
            const chartData = {
                id: 'chart-1',
                pairId,
                pairSymbol: 'BTCUSDT',
                originalChartPath: '/charts/btc-original.png',
                anonymizedChartPath: null,
                capturedAt: new Date().toISOString(),
                viewportWidth: 1920,
                viewportHeight: 1080,
                exchange: 'Binance',
                timeframe: '1D',
                theme: 'dark',
                windowDays: 365,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const chart = await repo.charts.create(chartData);
            const updated = await repo.charts.updateAnonymizedPath(chart.id, '/charts/btc-anonymized.png');
            expect(updated).toBeDefined();
            expect(updated?.anonymizedChartPath).toBe('/charts/btc-anonymized.png');
        });
    });
    describe('Chart Analyses Repository', () => {
        let pairId;
        let chartId;
        beforeEach(async () => {
            const pair = await repo.pairs.create({
                id: 'pair-1',
                symbol: 'BTCUSDT',
                rank: 1,
                marketCap: 1000000000,
                volume24h: 50000000,
                price: 50000,
                priceChange24h: 1000,
                priceChangePercent24h: 2.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            pairId = pair.id;
            const chart = await repo.charts.create({
                id: 'chart-1',
                pairId,
                pairSymbol: 'BTCUSDT',
                originalChartPath: '/charts/btc-original.png',
                anonymizedChartPath: null,
                capturedAt: new Date().toISOString(),
                viewportWidth: 1920,
                viewportHeight: 1080,
                exchange: 'Binance',
                timeframe: '1D',
                theme: 'dark',
                windowDays: 365,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            chartId = chart.id;
        });
        it('should create a new chart analysis', async () => {
            const analysisData = {
                id: 'analysis-1',
                chartId,
                pairId,
                aiName: 'Gemini',
                analysisJson: '{"trend": "bullish", "confidence": 0.85}',
                trend: 'bullish',
                trendConfidence: 0.85,
                countertrend: 'bearish',
                countertrendConfidence: 0.15,
                trendRank: 1,
                countertrendRank: 5,
                rankSum: 6,
                overallRank: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const result = await repo.chartAnalyses.create(analysisData);
            expect(result.id).toBe('analysis-1');
            expect(result.chartId).toBe(chartId);
            expect(result.aiName).toBe('Gemini');
            expect(result.trend).toBe('bullish');
        });
        it('should find analyses by chart ID', async () => {
            const analysisData = {
                id: 'analysis-1',
                chartId,
                pairId,
                aiName: 'Gemini',
                analysisJson: '{"trend": "bullish", "confidence": 0.85}',
                trend: 'bullish',
                trendConfidence: 0.85,
                countertrend: 'bearish',
                countertrendConfidence: 0.15,
                trendRank: 1,
                countertrendRank: 5,
                rankSum: 6,
                overallRank: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await repo.chartAnalyses.create(analysisData);
            const analyses = await repo.chartAnalyses.findByChartId(chartId);
            expect(analyses).toHaveLength(1);
            expect(analyses[0]?.chartId).toBe(chartId);
        });
        it('should find top ranked analyses', async () => {
            const analyses = [
                {
                    id: 'analysis-1',
                    chartId,
                    pairId,
                    aiName: 'Gemini',
                    analysisJson: '{"trend": "bullish", "confidence": 0.85}',
                    trend: 'bullish',
                    trendConfidence: 0.85,
                    countertrend: 'bearish',
                    countertrendConfidence: 0.15,
                    trendRank: 1,
                    countertrendRank: 5,
                    rankSum: 6,
                    overallRank: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'analysis-2',
                    chartId,
                    pairId,
                    aiName: 'Gemini',
                    analysisJson: '{"trend": "bearish", "confidence": 0.70}',
                    trend: 'bearish',
                    trendConfidence: 0.70,
                    countertrend: 'bullish',
                    countertrendConfidence: 0.30,
                    trendRank: 2,
                    countertrendRank: 4,
                    rankSum: 6,
                    overallRank: 2,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            for (const analysis of analyses) {
                await repo.chartAnalyses.create(analysis);
            }
            const topRanked = await repo.chartAnalyses.findTopRanked(2);
            expect(topRanked).toHaveLength(2);
            expect(topRanked[0]?.overallRank).toBe(1);
            expect(topRanked[1]?.overallRank).toBe(2);
        });
    });
    describe('Jobs Repository', () => {
        it('should create a new job', async () => {
            const jobData = {
                id: 'job-1',
                type: 'fetch_pairs',
                status: 'pending',
                metadata: '{"limit": 100, "source": "both"}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const result = await repo.jobs.create(jobData);
            expect(result.id).toBe('job-1');
            expect(result.type).toBe('fetch_pairs');
            expect(result.status).toBe('pending');
        });
        it('should update job status', async () => {
            const jobData = {
                id: 'job-1',
                type: 'fetch_pairs',
                status: 'pending',
                metadata: '{"limit": 100, "source": "both"}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const job = await repo.jobs.create(jobData);
            const updated = await repo.jobs.updateStatus(job.id, 'in_progress');
            expect(updated).toBeDefined();
            expect(updated?.status).toBe('in_progress');
            expect(updated?.startedAt).toBeDefined();
        });
        it('should find jobs by type', async () => {
            const jobs = [
                {
                    id: 'job-1',
                    type: 'fetch_pairs',
                    status: 'pending',
                    metadata: '{"limit": 100, "source": "both"}',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'job-2',
                    type: 'capture_charts',
                    status: 'pending',
                    metadata: '{"pairs": ["BTCUSDT"]}',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            for (const job of jobs) {
                await repo.jobs.create(job);
            }
            const fetchJobs = await repo.jobs.findByType('fetch_pairs');
            expect(fetchJobs).toHaveLength(1);
            expect(fetchJobs[0]?.type).toBe('fetch_pairs');
        });
    });
    describe('Versions Repository', () => {
        it('should create a new version', async () => {
            const versionData = {
                id: 'version-1',
                source: 'both',
                createdAt: new Date().toISOString(),
                coinCount: 100,
            };
            const result = await repo.versions.create(versionData);
            expect(result.id).toBe('version-1');
            expect(result.source).toBe('both');
            expect(result.coinCount).toBe(100);
        });
        it('should find versions by source', async () => {
            const versions = [
                {
                    id: 'version-1',
                    source: 'both',
                    createdAt: new Date().toISOString(),
                    coinCount: 100,
                },
                {
                    id: 'version-2',
                    source: 'cmc',
                    createdAt: new Date().toISOString(),
                    coinCount: 50,
                },
            ];
            for (const version of versions) {
                await repo.versions.create(version);
            }
            const bothVersions = await repo.versions.findBySource('both');
            expect(bothVersions).toHaveLength(1);
            expect(bothVersions[0]?.source).toBe('both');
        });
    });
    describe('Images Repository', () => {
        let versionId;
        beforeEach(async () => {
            const version = await repo.versions.create({
                id: 'version-1',
                source: 'both',
                createdAt: new Date().toISOString(),
                coinCount: 100,
            });
            versionId = version.id;
        });
        it('should create a new image', async () => {
            const imageData = {
                id: 'image-1',
                versionId,
                type: 'full',
                pair: 'BTCUSDT',
                capturedAt: new Date().toISOString(),
                path: '/images/btc-full.png',
                thumbPath: '/images/btc-thumb.png',
            };
            const result = await repo.images.create(imageData);
            expect(result.id).toBe('image-1');
            expect(result.versionId).toBe(versionId);
            expect(result.type).toBe('full');
            expect(result.pair).toBe('BTCUSDT');
        });
        it('should find images by version ID', async () => {
            const imageData = {
                id: 'image-1',
                versionId,
                type: 'full',
                pair: 'BTCUSDT',
                capturedAt: new Date().toISOString(),
                path: '/images/btc-full.png',
                thumbPath: '/images/btc-thumb.png',
            };
            await repo.images.create(imageData);
            const images = await repo.images.findByVersionId(versionId);
            expect(images).toHaveLength(1);
            expect(images[0]?.versionId).toBe(versionId);
        });
    });
    describe('Repository Integration', () => {
        it('should maintain referential integrity between tables', async () => {
            const pair = await repo.pairs.create({
                id: 'pair-1',
                symbol: 'BTCUSDT',
                rank: 1,
                marketCap: 1000000000,
                volume24h: 50000000,
                price: 50000,
                priceChange24h: 1000,
                priceChangePercent24h: 2.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            const chart = await repo.charts.create({
                id: 'chart-1',
                pairId: pair.id,
                pairSymbol: pair.symbol,
                originalChartPath: '/charts/btc-original.png',
                anonymizedChartPath: null,
                capturedAt: new Date().toISOString(),
                viewportWidth: 1920,
                viewportHeight: 1080,
                exchange: 'Binance',
                timeframe: '1D',
                theme: 'dark',
                windowDays: 365,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            const analysis = await repo.chartAnalyses.create({
                id: 'analysis-1',
                chartId: chart.id,
                pairId: pair.id,
                aiName: 'Gemini',
                analysisJson: '{"trend": "bullish", "confidence": 0.85}',
                trend: 'bullish',
                trendConfidence: 0.85,
                countertrend: 'bearish',
                countertrendConfidence: 0.15,
                trendRank: 1,
                countertrendRank: 5,
                rankSum: 6,
                overallRank: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            const foundPair = await repo.pairs.findById(pair.id);
            const foundChart = await repo.charts.findById(chart.id);
            const foundAnalysis = await repo.chartAnalyses.findById(analysis.id);
            expect(foundPair).toBeDefined();
            expect(foundChart).toBeDefined();
            expect(foundAnalysis).toBeDefined();
            expect(foundChart?.pairId).toBe(pair.id);
            expect(foundAnalysis?.chartId).toBe(chart.id);
            expect(foundAnalysis?.pairId).toBe(pair.id);
        });
    });
});
//# sourceMappingURL=repositories.test.js.map