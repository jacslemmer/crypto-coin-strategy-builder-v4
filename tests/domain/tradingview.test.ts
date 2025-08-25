import { describe, expect, it } from 'vitest';

import {
  buildTradingViewUrl,
  computeAnonymizedCropBox,
  isUsdtPairSymbol,
  mapTickersToPreferredUsdtPair,
  type Viewport,
} from '../../src/domain/tradingview.js';

describe('USDT filters', () => {
  it('detects USDT symbols case-insensitively', () => {
    expect(isUsdtPairSymbol('btcusdt')).toBe(true);
    expect(isUsdtPairSymbol('ETHUSDT')).toBe(true);
    expect(isUsdtPairSymbol('BTCUSD')).toBe(false);
  });

  it('maps and normalizes tickers to USDT pairs', () => {
    const input = ['btcusdt', 'ethusdt', 'adausd', 'dogeusdt'];
    const out = mapTickersToPreferredUsdtPair(input);
    expect(out).toEqual(['BTCUSDT', 'ETHUSDT', 'DOGEUSDT']);
  });
});

describe('TradingView URL generation', () => {
  it('builds URL with required parameters', () => {
    const url = buildTradingViewUrl({
      exchange: 'BINANCE',
      symbol: 'BTCUSDT',
      theme: 'light',
      timeframe: '1D',
      windowDays: 365,
      dropdownClosed: true,
    });
    expect(url).toContain('https://www.tradingview.com/chart/?');
    expect(url).toContain('symbol=BINANCE%3ABTCUSDT');
    expect(url).toContain('interval=1D');
    expect(url).toContain('theme=light');
    expect(url).toContain('range=365D');
    expect(url).toContain('toolbar=false');
  });
});

describe('Anonymized crop box', () => {
  it('computes crop box with deterministic ratios', () => {
    const viewport: Viewport = { width: 1920, height: 1080 };
    const crop = computeAnonymizedCropBox(viewport);
    expect(crop).toEqual({ x: 0, y: Math.round(1080 * 0.08), width: 1920, height: 1080 - Math.round(1080 * 0.08) - Math.round(1080 * 0.12) });
  });

  it('throws on invalid viewport', () => {
    expect(() => computeAnonymizedCropBox({ width: 100, height: 100 })).not.toThrow();
    expect(() => computeAnonymizedCropBox({ width: 0, height: 0 })).toThrow();
  });
});


