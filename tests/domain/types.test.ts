import { describe, expect, it } from 'vitest';
import {
  type Pair,
  type Chart,
  type ChartAnalysis,
  type Job,
  isPair,
  isChart,
  isChartAnalysis,
  isJob,
} from '../../src/domain/types.js';

describe('Type Guards', () => {
  describe('isPair', () => {
    it('validates a valid Pair object', () => {
      const validPair: Pair = {
        id: '1',
        symbol: 'BTCUSDT',
        rank: 1,
        marketCap: 1000000000,
        volume24h: 50000000,
        price: 50000,
        priceChange24h: 1000,
        priceChangePercent24h: 2.0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isPair(validPair)).toBe(true);
    });

    it('rejects invalid Pair objects', () => {
      expect(isPair(null)).toBe(false);
      expect(isPair(undefined)).toBe(false);
      expect(isPair('string')).toBe(false);
      expect(isPair({})).toBe(false);
      expect(isPair({ id: '1' })).toBe(false);
      expect(isPair({ id: '1', symbol: 'BTCUSDT' })).toBe(false);
    });

    it('rejects Pair with wrong types', () => {
      const invalidPair = {
        id: 123, // should be string
        symbol: 'BTCUSDT',
        rank: 1,
        marketCap: 1000000000,
        volume24h: 50000000,
        price: 50000,
        priceChange24h: 1000,
        priceChangePercent24h: 2.0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isPair(invalidPair)).toBe(false);
    });
  });

  describe('isChart', () => {
    it('validates a valid Chart object', () => {
      const validChart: Chart = {
        id: '1',
        pairId: '1',
        pairSymbol: 'BTCUSDT',
        originalChartPath: '/charts/btc-original.png',
        anonymizedChartPath: null,
        capturedAt: new Date('2024-01-01'),
        viewport: { width: 1920, height: 1080 },
        metadata: {
          exchange: 'BINANCE',
          timeframe: '1D',
          theme: 'light',
          windowDays: 365,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isChart(validChart)).toBe(true);
    });

    it('validates Chart with anonymized path', () => {
      const chartWithAnonymized: Chart = {
        id: '1',
        pairId: '1',
        pairSymbol: 'BTCUSDT',
        originalChartPath: '/charts/btc-original.png',
        anonymizedChartPath: '/charts/btc-anonymized.png',
        capturedAt: new Date('2024-01-01'),
        viewport: { width: 1920, height: 1080 },
        metadata: {
          exchange: 'BINANCE',
          timeframe: '1D',
          theme: 'light',
          windowDays: 365,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isChart(chartWithAnonymized)).toBe(true);
    });

    it('rejects invalid Chart objects', () => {
      expect(isChart(null)).toBe(false);
      expect(isChart(undefined)).toBe(false);
      expect(isChart('string')).toBe(false);
      expect(isChart({})).toBe(false);
    });

    it('rejects Chart with invalid viewport', () => {
      const invalidChart = {
        id: '1',
        pairId: '1',
        pairSymbol: 'BTCUSDT',
        originalChartPath: '/charts/btc-original.png',
        anonymizedChartPath: null,
        capturedAt: new Date('2024-01-01'),
        viewport: { width: 'invalid', height: 1080 }, // width should be number
        metadata: {
          exchange: 'BINANCE',
          timeframe: '1D',
          theme: 'light',
          windowDays: 365,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isChart(invalidChart)).toBe(false);
    });
  });

  describe('isChartAnalysis', () => {
    it('validates a valid ChartAnalysis object', () => {
      const validAnalysis: ChartAnalysis = {
        id: '1',
        chartId: '1',
        pairId: '1',
        aiName: 'gemini',
        analysisJson: '{"trend": "bullish", "confidence": 0.8}',
        trend: 'bullish',
        trendConfidence: 0.8,
        countertrend: 'bearish',
        countertrendConfidence: 0.2,
        trendRank: 1,
        countertrendRank: 5,
        rankSum: 6,
        overallRank: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isChartAnalysis(validAnalysis)).toBe(true);
    });

    it('rejects invalid ChartAnalysis objects', () => {
      expect(isChartAnalysis(null)).toBe(false);
      expect(isChartAnalysis(undefined)).toBe(false);
      expect(isChartAnalysis('string')).toBe(false);
      expect(isChartAnalysis({})).toBe(false);
    });

    it('rejects ChartAnalysis with invalid confidence values', () => {
      const invalidAnalysis = {
        id: '1',
        chartId: '1',
        pairId: '1',
        aiName: 'gemini',
        analysisJson: '{"trend": "bullish", "confidence": 0.8}',
        trend: 'bullish',
        trendConfidence: 'invalid', // should be number
        countertrend: 'bearish',
        countertrendConfidence: 0.2,
        trendRank: 1,
        countertrendRank: 5,
        rankSum: 6,
        overallRank: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isChartAnalysis(invalidAnalysis)).toBe(false);
    });
  });

  describe('isJob', () => {
    it('validates a valid Job object', () => {
      const validJob: Job = {
        id: '1',
        type: 'fetch_pairs',
        status: 'pending',
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isJob(validJob)).toBe(true);
    });

    it('validates Job with all optional fields', () => {
      const completeJob: Job = {
        id: '1',
        type: 'capture_charts',
        status: 'completed',
        parentJobId: 'parent-1',
        metadata: { pairCount: 15 },
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:30:00'),
        error: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isJob(completeJob)).toBe(true);
    });

    it('validates Job with error', () => {
      const failedJob: Job = {
        id: '1',
        type: 'analyze_charts',
        status: 'failed',
        metadata: {},
        error: 'API rate limit exceeded',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isJob(failedJob)).toBe(true);
    });

    it('rejects invalid Job objects', () => {
      expect(isJob(null)).toBe(false);
      expect(isJob(undefined)).toBe(false);
      expect(isJob('string')).toBe(false);
      expect(isJob({})).toBe(false);
    });

    it('rejects Job with invalid type', () => {
      const invalidJob = {
        id: '1',
        type: 'invalid_type', // should be one of the valid types
        status: 'pending',
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isJob(invalidJob)).toBe(false);
    });

    it('rejects Job with invalid status', () => {
      const invalidJob = {
        id: '1',
        type: 'fetch_pairs',
        status: 'invalid_status', // should be one of the valid statuses
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(isJob(invalidJob)).toBe(false);
    });
  });
});

describe('Type Definitions', () => {
  it('ensures Pair interface has all required fields', () => {
    const pair: Pair = {
      id: '1',
      symbol: 'BTCUSDT',
      rank: 1,
      marketCap: 1000000000,
      volume24h: 50000000,
      price: 50000,
      priceChange24h: 1000,
      priceChangePercent24h: 2.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(pair.id).toBeDefined();
    expect(pair.symbol).toBeDefined();
    expect(pair.rank).toBeDefined();
    expect(pair.marketCap).toBeDefined();
    expect(pair.volume24h).toBeDefined();
    expect(pair.price).toBeDefined();
    expect(pair.priceChange24h).toBeDefined();
    expect(pair.priceChangePercent24h).toBeDefined();
    expect(pair.createdAt).toBeDefined();
    expect(pair.updatedAt).toBeDefined();
  });

  it('ensures Chart interface has all required fields', () => {
    const chart: Chart = {
      id: '1',
      pairId: '1',
      pairSymbol: 'BTCUSDT',
      originalChartPath: '/charts/btc-original.png',
      anonymizedChartPath: null,
      capturedAt: new Date(),
      viewport: { width: 1920, height: 1080 },
      metadata: {
        exchange: 'BINANCE',
        timeframe: '1D',
        theme: 'light',
        windowDays: 365,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(chart.id).toBeDefined();
    expect(chart.pairId).toBeDefined();
    expect(chart.pairSymbol).toBeDefined();
    expect(chart.originalChartPath).toBeDefined();
    expect(chart.capturedAt).toBeDefined();
    expect(chart.viewport).toBeDefined();
    expect(chart.metadata).toBeDefined();
    expect(chart.createdAt).toBeDefined();
    expect(chart.updatedAt).toBeDefined();
  });

  it('ensures ChartAnalysis interface has all required fields', () => {
    const analysis: ChartAnalysis = {
      id: '1',
      chartId: '1',
      pairId: '1',
      aiName: 'gemini',
      analysisJson: '{"trend": "bullish", "confidence": 0.8}',
      trend: 'bullish',
      trendConfidence: 0.8,
      countertrend: 'bearish',
      countertrendConfidence: 0.2,
      trendRank: 1,
      countertrendRank: 5,
      rankSum: 6,
      overallRank: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(analysis.id).toBeDefined();
    expect(analysis.chartId).toBeDefined();
    expect(analysis.pairId).toBeDefined();
    expect(analysis.aiName).toBeDefined();
    expect(analysis.analysisJson).toBeDefined();
    expect(analysis.trend).toBeDefined();
    expect(analysis.trendConfidence).toBeDefined();
    expect(analysis.countertrend).toBeDefined();
    expect(analysis.countertrendConfidence).toBeDefined();
    expect(analysis.trendRank).toBeDefined();
    expect(analysis.countertrendRank).toBeDefined();
    expect(analysis.rankSum).toBeDefined();
    expect(analysis.overallRank).toBeDefined();
    expect(analysis.createdAt).toBeDefined();
    expect(analysis.updatedAt).toBeDefined();
  });

  it('ensures Job interface has all required fields', () => {
    const job: Job = {
      id: '1',
      type: 'fetch_pairs',
      status: 'pending',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(job.id).toBeDefined();
    expect(job.type).toBeDefined();
    expect(job.status).toBeDefined();
    expect(job.metadata).toBeDefined();
    expect(job.createdAt).toBeDefined();
    expect(job.updatedAt).toBeDefined();
  });
});


