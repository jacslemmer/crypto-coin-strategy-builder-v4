export type UsdtPair = `${string}USDT`;

export type TradingViewUrlParams = {
  exchange: 'BINANCE';
  symbol: UsdtPair;
  theme: 'light';
  timeframe: '1D';
  windowDays: 365;
  dropdownClosed: true;
};

export const defaultParams: TradingViewUrlParams = {
  exchange: 'BINANCE',
  symbol: 'BTCUSDT',
  theme: 'light',
  timeframe: '1D',
  windowDays: 365,
  dropdownClosed: true,
};

export function buildTradingViewUrl(params: TradingViewUrlParams): string {
  const { exchange, symbol, theme, timeframe, windowDays, dropdownClosed } = params;

  const base = 'https://www.tradingview.com/chart/';
  const query = new URLSearchParams({
    theme,
    interval: timeframe,
    studies: '',
    range: `${windowDays}D`,
    symbol: `${exchange}:${symbol}`,
    toolbar: dropdownClosed ? 'false' : 'true',
  });
  return `${base}?${query.toString()}`;
}

export function isUsdtPairSymbol(symbol: string): symbol is UsdtPair {
  return /USDT$/i.test(symbol);
}

export function mapTickersToPreferredUsdtPair(tickers: ReadonlyArray<string>): UsdtPair[] {
  return tickers
    .filter((t) => isUsdtPairSymbol(t))
    .map((t) => t.toUpperCase() as UsdtPair);
}

export type CropBox = { x: number; y: number; width: number; height: number };

export type Viewport = { width: number; height: number };

export function computeAnonymizedCropBox(viewport: Viewport): CropBox {
  const { width, height } = viewport;
  const topLabelHeight = Math.round(height * 0.08);
  const bottomTimelineHeight = Math.round(height * 0.12);
  const x = 0;
  const y = topLabelHeight;
  const cropWidth = width;
  const cropHeight = height - topLabelHeight - bottomTimelineHeight;
  if (cropHeight <= 0 || cropWidth <= 0) {
    throw new Error('Invalid crop box for given viewport');
  }
  return { x, y, width: cropWidth, height: cropHeight };
}








