import type { Logger } from '../infra/logging/logger.js';

// Types and interfaces
export interface ChartCaptureConfig {
  baseUrl: string;
  defaultParams: {
    symbol: string;
    interval: string;
    theme: string;
    style: string;
  };
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface ChartCaptureParams {
  symbol?: string;
  interval?: string;
  theme?: string;
  style?: string;
}

export interface ChartMetadata {
  theme: string;
  style: string;
  width: number;
  height: number;
}

export interface ChartCaptureResult {
  success: boolean;
  chartUrl?: string;
  symbol: string;
  interval: string;
  capturedAt?: string;
  metadata?: ChartMetadata;
  error?: string;
}

export interface BatchCaptureOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface BatchCaptureResult {
  total: number;
  successful: number;
  failed: number;
  results: ChartCaptureResult[];
}

// Supported values
const SUPPORTED_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;
const SUPPORTED_THEMES = ['light', 'dark'] as const;
const SUPPORTED_STYLES = ['1', '2', '3', '4', '8', '9'] as const;

export class ChartCaptureService {
  private config: ChartCaptureConfig;
  private logger: Logger;

  constructor(config?: Partial<ChartCaptureConfig>, logger?: Logger) {
    this.config = {
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
      ...config,
    };

    this.logger = logger || {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  }

  /**
   * Generate a TradingView chart URL with the specified parameters
   */
  generateChartUrl(symbol: string, params?: ChartCaptureParams): string {
    const url = new URL(this.config.baseUrl);
    
    // Set symbol (required)
    url.searchParams.set('symbol', symbol);
    
    // Set interval
    const interval = params?.interval || this.config.defaultParams.interval;
    url.searchParams.set('interval', interval);
    
    // Set theme
    const theme = params?.theme || this.config.defaultParams.theme;
    url.searchParams.set('theme', theme);
    
    // Set style
    const style = params?.style || this.config.defaultParams.style;
    url.searchParams.set('style', style);
    
    return url.toString();
  }

  /**
   * Validate if a symbol is in the correct format for TradingView
   */
  validateSymbol(symbol: string): boolean {
    if (!symbol || typeof symbol !== 'string') return false;
    
    // Must end with USDT and be at least 5 characters
    if (symbol.length < 5) return false;
    if (!symbol.endsWith('USDT')) return false;
    
    // Must start with letters
    if (!/^[A-Z]/.test(symbol)) return false;
    
    // Must contain only letters, numbers, and hyphens
    if (!/^[A-Z0-9-]+USDT$/.test(symbol)) return false;
    
    return true;
  }

  /**
   * Validate if an interval is supported by TradingView
   */
  validateInterval(interval: string): boolean {
    return SUPPORTED_INTERVALS.includes(interval as any);
  }

  /**
   * Validate if a theme is supported
   */
  validateTheme(theme: string): boolean {
    return SUPPORTED_THEMES.includes(theme as any);
  }

  /**
   * Validate if a style is supported
   */
  validateStyle(style: string): boolean {
    return SUPPORTED_STYLES.includes(style as any);
  }

  /**
   * Capture a single chart
   */
  async captureChart(symbol: string, params?: ChartCaptureParams): Promise<ChartCaptureResult> {
    try {
      // Validate symbol
      if (!this.validateSymbol(symbol)) {
        const error = 'Invalid symbol format. Must be a valid USDT trading pair.';
        this.logger.error('Chart capture failed', { symbol, error });
        return {
          success: false,
          symbol,
          interval: params?.interval || this.config.defaultParams.interval,
          error,
        };
      }

      // Validate interval if provided
      if (params?.interval && !this.validateInterval(params.interval)) {
        const error = 'Invalid interval. Must be one of: 1m, 5m, 15m, 1h, 4h, 1d, 1w';
        this.logger.error('Chart capture failed', { symbol, error });
        return {
          success: false,
          symbol,
          interval: params.interval,
          error,
        };
      }

      // Validate theme if provided
      if (params?.theme && !this.validateTheme(params.theme)) {
        const error = 'Invalid theme. Must be either "light" or "dark"';
        this.logger.error('Chart capture failed', { symbol, error });
        return {
          success: false,
          symbol,
          interval: params?.interval || this.config.defaultParams.interval,
          error,
        };
      }

      // Validate style if provided
      if (params?.style && !this.validateStyle(params.style)) {
        const error = 'Invalid style. Must be one of: 1, 2, 3, 4, 8, 9';
        this.logger.error('Chart capture failed', { symbol, error });
        return {
          success: false,
          symbol,
          interval: params?.interval || this.config.defaultParams.interval,
          error,
        };
      }

      const interval = params?.interval || this.config.defaultParams.interval;
      const theme = params?.theme || this.config.defaultParams.theme;
      const style = params?.style || this.config.defaultParams.style;

      this.logger.info('Chart capture initiated', { symbol, interval });

      // Generate chart URL
      const chartUrl = this.generateChartUrl(symbol, { interval, theme, style });

      // Perform the actual chart capture (this would integrate with a headless browser or screenshot service)
      const captureResult = await this.performChartCapture(symbol, chartUrl, { interval, theme, style });

      return captureResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Chart capture failed', { symbol, error: errorMessage });
      
      return {
        success: false,
        symbol,
        interval: params?.interval || this.config.defaultParams.interval,
        error: errorMessage,
      };
    }
  }

  /**
   * Capture multiple charts in batches
   */
  async batchCaptureCharts(
    symbols: string[], 
    options: BatchCaptureOptions = {}
  ): Promise<ChartCaptureResult[]> {
    const batchSize = options.batchSize || 10;
    const delayBetweenBatches = options.delayBetweenBatches || 1000;
    const results: ChartCaptureResult[] = [];
    
    this.logger.info('Starting batch chart capture', { total: symbols.length, batchSize });

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(symbol => this.captureChart(symbol));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < symbols.length) {
        await this.delay(delayBetweenBatches);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    this.logger.info('Batch chart capture completed', {
      total: results.length,
      successful,
      failed,
    });

    return results;
  }

  /**
   * Get all supported intervals
   */
  getSupportedIntervals(): readonly string[] {
    return SUPPORTED_INTERVALS;
  }

  /**
   * Get all supported themes
   */
  getSupportedThemes(): readonly string[] {
    return SUPPORTED_THEMES;
  }

  /**
   * Get all supported chart styles
   */
  getSupportedStyles(): readonly string[] {
    return SUPPORTED_STYLES;
  }

  /**
   * Perform the actual chart capture (to be implemented based on requirements)
   */
  private async performChartCapture(
    symbol: string, 
    chartUrl: string, 
    params: ChartCaptureParams
  ): Promise<ChartCaptureResult> {
    // This is a placeholder implementation
    // In a real implementation, this would:
    // 1. Use a headless browser (Puppeteer/Playwright)
    // 2. Navigate to the chart URL
    // 3. Wait for the chart to load
    // 4. Take a screenshot
    // 5. Save the image
    // 6. Return metadata
    
    const interval = params.interval || this.config.defaultParams.interval;
    const theme = params.theme || this.config.defaultParams.theme;
    const style = params.style || this.config.defaultParams.style;

    // Simulate successful capture
    return {
      success: true,
      chartUrl,
      symbol,
      interval,
      capturedAt: new Date().toISOString(),
      metadata: {
        theme,
        style,
        width: 1920,
        height: 1080,
      },
    };
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
