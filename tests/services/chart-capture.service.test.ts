import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChartCaptureService } from '../../src/services/chart-capture.service.js';
import type { ChartCaptureConfig, ChartCaptureResult } from '../../src/services/chart-capture.service.js';

// Mock dependencies
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockConfig: ChartCaptureConfig = {
  baseUrl: 'https://www.tradingview.com/chart',
  defaultParams: {
    symbol: 'BTCUSDT',
    interval: '1D',
    theme: 'dark',
    style: '1',
  },
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
};

describe('ChartCaptureService', () => {
  let service: ChartCaptureService;

  beforeEach(() => {
    service = new ChartCaptureService(mockConfig, mockLogger as any);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      expect(service).toBeInstanceOf(ChartCaptureService);
      expect(service['config']).toEqual(mockConfig);
      expect(service['logger']).toBe(mockLogger);
    });

    it('should use default configuration when not provided', () => {
      const defaultService = new ChartCaptureService();
      expect(defaultService['config']).toBeDefined();
      expect(defaultService['config'].baseUrl).toBe('https://www.tradingview.com/chart');
    });
  });

  describe('generateChartUrl', () => {
    it('should generate basic chart URL with default parameters', () => {
      const url = service.generateChartUrl('BTCUSDT');
      expect(url).toContain('https://www.tradingview.com/chart');
      expect(url).toContain('symbol=BTCUSDT');
      expect(url).toContain('interval=1D');
      expect(url).toContain('theme=dark');
    });

    it('should generate chart URL with custom parameters', () => {
      const customParams = {
        symbol: 'ETHUSDT',
        interval: '4H',
        theme: 'light',
        style: '2',
      };
      const url = service.generateChartUrl('ETHUSDT', customParams);
      expect(url).toContain('symbol=ETHUSDT');
      expect(url).toContain('interval=4H');
      expect(url).toContain('theme=light');
      expect(url).toContain('style=2');
    });

    it('should handle special characters in symbol names', () => {
      const url = service.generateChartUrl('BTC/USDT');
      expect(url).toContain('symbol=BTC%2FUSDT');
    });

    it('should include all required TradingView parameters', () => {
      const url = service.generateChartUrl('BTCUSDT');
      const urlObj = new URL(url);
      expect(urlObj.searchParams.get('symbol')).toBe('BTCUSDT');
      expect(urlObj.searchParams.get('interval')).toBe('1D');
      expect(urlObj.searchParams.get('theme')).toBe('dark');
      expect(urlObj.searchParams.get('style')).toBe('1');
    });
  });

  describe('validateSymbol', () => {
    it('should validate valid USDT symbols', () => {
      expect(service.validateSymbol('BTCUSDT')).toBe(true);
      expect(service.validateSymbol('ETHUSDT')).toBe(true);
      expect(service.validateSymbol('ADAUSDT')).toBe(true);
    });

    it('should reject invalid symbols', () => {
      expect(service.validateSymbol('')).toBe(false);
      expect(service.validateSymbol('BTC')).toBe(false);
      expect(service.validateSymbol('BTC-USD')).toBe(false);
      expect(service.validateSymbol('123')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(service.validateSymbol('BTCUSDT ')).toBe(false);
      expect(service.validateSymbol(' BTCUSDT')).toBe(false);
      expect(service.validateSymbol('btcusdt')).toBe(false);
    });
  });

  describe('validateInterval', () => {
    it('should validate supported intervals', () => {
      expect(service.validateInterval('1m')).toBe(true);
      expect(service.validateInterval('5m')).toBe(true);
      expect(service.validateInterval('15m')).toBe(true);
      expect(service.validateInterval('1h')).toBe(true);
      expect(service.validateInterval('4h')).toBe(true);
      expect(service.validateInterval('1d')).toBe(true);
      expect(service.validateInterval('1w')).toBe(true);
    });

    it('should reject invalid intervals', () => {
      expect(service.validateInterval('')).toBe(false);
      expect(service.validateInterval('2m')).toBe(false);
      expect(service.validateInterval('30m')).toBe(false);
      expect(service.validateInterval('2h')).toBe(false);
      expect(service.validateInterval('2d')).toBe(false);
    });
  });

  describe('captureChart', () => {
    it('should successfully capture a chart with valid parameters', async () => {
      const result = await service.captureChart('BTCUSDT');
      
      expect(result.success).toBe(true);
      expect(result.symbol).toBe('BTCUSDT');
      expect(result.chartUrl).toContain('BTCUSDT');
      expect(mockLogger.info).toHaveBeenCalledWith('Chart capture initiated', {
        symbol: 'BTCUSDT',
        interval: '1D',
      });
    });

    it('should fail with invalid symbol', async () => {
      const result = await service.captureChart('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid symbol');
      expect(mockLogger.error).toHaveBeenCalledWith('Chart capture failed', {
        symbol: '',
        error: expect.stringContaining('Invalid symbol'),
      });
    });

    it('should fail with invalid interval', async () => {
      const result = await service.captureChart('BTCUSDT', { interval: '2m' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid interval');
    });
  });

  describe('batchCaptureCharts', () => {
    it('should capture multiple charts successfully', async () => {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
      
      const results = await service.batchCaptureCharts(symbols);
      
      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Batch chart capture completed', {
        total: 3,
        successful: 3,
        failed: 0,
      });
    });

    it('should handle partial failures in batch capture', async () => {
      const symbols = ['BTCUSDT', 'INVALID', 'ETHUSDT'];
      
      const results = await service.batchCaptureCharts(symbols);
      
      expect(results.length).toBe(3);
      expect(results.filter(r => r.success)).toHaveLength(2);
      expect(results.filter(r => !r.success)).toHaveLength(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Batch chart capture completed', {
        total: 3,
        successful: 2,
        failed: 1,
      });
    });

    it('should respect batch size limits', async () => {
      const symbols = Array.from({ length: 25 }, (_, i) => `TOKEN${i}USDT`);
      
      const results = await service.batchCaptureCharts(symbols, { batchSize: 10 });
      
      expect(results.length).toBe(25);
      expect(mockLogger.info).toHaveBeenCalledWith('Batch chart capture completed', {
        total: 25,
        successful: 25,
        failed: 0,
      });
    });
  });

  describe('getSupportedIntervals', () => {
    it('should return all supported intervals', () => {
      const intervals = service.getSupportedIntervals();
      
      expect(intervals).toContain('1m');
      expect(intervals).toContain('5m');
      expect(intervals).toContain('15m');
      expect(intervals).toContain('1h');
      expect(intervals).toContain('4h');
      expect(intervals).toContain('1d');
      expect(intervals).toContain('1w');
      expect(intervals.length).toBe(7);
    });
  });

  describe('getSupportedThemes', () => {
    it('should return all supported themes', () => {
      const themes = service.getSupportedThemes();
      
      expect(themes).toContain('light');
      expect(themes).toContain('light');
      expect(themes.length).toBe(2);
    });
  });

  describe('getSupportedStyles', () => {
    it('should return all supported chart styles', () => {
      const styles = service.getSupportedStyles();
      
      expect(styles).toContain('1'); // Bars
      expect(styles).toContain('2'); // Candles
      expect(styles).toContain('3'); // Hollow Candles
      expect(styles).toContain('4'); // Heikin Ashi
      expect(styles).toContain('8'); // Line
      expect(styles).toContain('9'); // Area
      expect(styles.length).toBe(6);
    });
  });
});
