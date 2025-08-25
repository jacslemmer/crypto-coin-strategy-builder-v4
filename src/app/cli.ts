#!/usr/bin/env node
import { buildTradingViewUrl } from '../domain/tradingview.js';

export function main(): void {
  const url = buildTradingViewUrl({
    exchange: 'BINANCE',
    symbol: 'BTCUSDT',
    theme: 'light',
    timeframe: '1D',
    windowDays: 365,
    dropdownClosed: true,
  });
  // eslint-disable-next-line no-console
  console.log(url);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}


