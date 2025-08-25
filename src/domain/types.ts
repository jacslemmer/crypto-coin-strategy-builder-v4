// Core domain types for the crypto coin strategy builder
// These types will be shared across frontend and backend

export interface Pair {
  id: string;
  symbol: string;
  rank: number;
  marketCap: number;
  volume24h: number;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chart {
  id: string;
  pairId: string;
  pairSymbol: string;
  originalChartPath: string;
  anonymizedChartPath: string | null;
  capturedAt: Date;
  viewport: {
    width: number;
    height: number;
  };
  metadata: {
    exchange: string;
    timeframe: string;
    theme: string;
    windowDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartAnalysis {
  id: string;
  chartId: string;
  pairId: string;
  aiName: string;
  analysisJson: string;
  trend: string;
  trendConfidence: number;
  countertrend: string;
  countertrendConfidence: number;
  trendRank: number;
  countertrendRank: number;
  rankSum: number;
  overallRank: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  type: 'fetch_pairs' | 'capture_charts' | 'anonymize_charts' | 'analyze_charts';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  parentJobId?: string;
  metadata: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Type guards for runtime validation
export function isPair(obj: unknown): obj is Pair {
  if (!obj || typeof obj !== 'object') return false;
  const pair = obj as Record<string, unknown>;
  
  return (
    typeof pair.id === 'string' &&
    typeof pair.symbol === 'string' &&
    typeof pair.rank === 'number' &&
    typeof pair.marketCap === 'number' &&
    typeof pair.volume24h === 'number' &&
    typeof pair.price === 'number' &&
    typeof pair.priceChange24h === 'number' &&
    typeof pair.priceChangePercent24h === 'number' &&
    pair.createdAt instanceof Date &&
    pair.updatedAt instanceof Date
  );
}

export function isChart(obj: unknown): obj is Chart {
  if (!obj || typeof obj !== 'object') return false;
  const chart = obj as Record<string, unknown>;
  
  // Check viewport structure
  if (!chart.viewport || typeof chart.viewport !== 'object' || chart.viewport === null) return false;
  const viewport = chart.viewport as Record<string, unknown>;
  if (typeof viewport.width !== 'number' || typeof viewport.height !== 'number') return false;
  
  // Check metadata structure
  if (!chart.metadata || typeof chart.metadata !== 'object' || chart.metadata === null) return false;
  const metadata = chart.metadata as Record<string, unknown>;
  if (
    typeof metadata.exchange !== 'string' ||
    typeof metadata.timeframe !== 'string' ||
    typeof metadata.theme !== 'string' ||
    typeof metadata.windowDays !== 'number'
  ) return false;
  
  return (
    typeof chart.id === 'string' &&
    typeof chart.pairId === 'string' &&
    typeof chart.pairSymbol === 'string' &&
    typeof chart.originalChartPath === 'string' &&
    (chart.anonymizedChartPath === null || typeof chart.anonymizedChartPath === 'string') &&
    chart.capturedAt instanceof Date &&
    chart.createdAt instanceof Date &&
    chart.updatedAt instanceof Date
  );
}

export function isChartAnalysis(obj: unknown): obj is ChartAnalysis {
  if (!obj || typeof obj !== 'object') return false;
  const analysis = obj as Record<string, unknown>;
  
  return (
    typeof analysis.id === 'string' &&
    typeof analysis.chartId === 'string' &&
    typeof analysis.pairId === 'string' &&
    typeof analysis.aiName === 'string' &&
    typeof analysis.analysisJson === 'string' &&
    typeof analysis.trend === 'string' &&
    typeof analysis.trendConfidence === 'number' &&
    typeof analysis.countertrend === 'string' &&
    typeof analysis.countertrendConfidence === 'number' &&
    typeof analysis.trendRank === 'number' &&
    typeof analysis.countertrendRank === 'number' &&
    typeof analysis.rankSum === 'number' &&
    typeof analysis.overallRank === 'number' &&
    analysis.createdAt instanceof Date &&
    analysis.updatedAt instanceof Date
  );
}

export function isJob(obj: unknown): obj is Job {
  if (!obj || typeof obj !== 'object') return false;
  const job = obj as Record<string, unknown>;
  
  const jobType = job.type as string;
  const jobStatus = job.status as string;
  
  const isValidJobType = jobType === 'fetch_pairs' || jobType === 'capture_charts' || jobType === 'anonymize_charts' || jobType === 'analyze_charts';
  const isValidJobStatus = jobStatus === 'pending' || jobStatus === 'in_progress' || jobStatus === 'completed' || jobStatus === 'failed';
  
  return (
    typeof job.id === 'string' &&
    isValidJobType &&
    isValidJobStatus &&
    (job.parentJobId === undefined || typeof job.parentJobId === 'string') &&
    typeof job.metadata === 'object' &&
    (job.startedAt === undefined || job.startedAt instanceof Date) &&
    (job.completedAt === undefined || job.completedAt instanceof Date) &&
    (job.error === undefined || typeof job.error === 'string') &&
    job.createdAt instanceof Date &&
    job.updatedAt instanceof Date
  );
}

// Utility types
export type UsdtPair = `${string}USDT`;

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
