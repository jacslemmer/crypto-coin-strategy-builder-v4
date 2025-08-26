import type { Request, Response, NextFunction } from 'express';

// Server dependencies for all services
export interface ServerDeps {
  pairsService: PairsService;
  chartsService: ChartsService;
  analysisService: AnalysisService;
  rankingsService: RankingsService;
  jobsService: JobsService;
  versionsService: VersionsService;
}

// Service interfaces
export interface PairsService {
  getPairs(params: GetPairsParams): Promise<GetPairsResponse>;
  getPairById(id: string): Promise<Pair | null>;
  fetchPairs(limit?: number): Promise<{
    success: boolean;
    pairsFetched: number;
    message: string;
    error?: string;
  }>;
  getPairsCount(): Promise<{
    success: boolean;
    count: number;
  }>;
}

export interface ChartsService {
  getCharts(params: GetChartsParams): Promise<GetChartsResponse>;
  getChartById(id: string): Promise<Chart | null>;
  createChart(params: CreateChartParams): Promise<CreateChartResponse>;
}

export interface AnalysisService {
  getAnalyses(params: GetAnalysesParams): Promise<GetAnalysesResponse>;
  requestAnalysis(params: RequestAnalysisParams): Promise<RequestAnalysisResponse>;
}

export interface RankingsService {
  getRankings(params: GetRankingsParams): Promise<GetRankingsResponse>;
  generateRankings(params: GenerateRankingsParams): Promise<GenerateRankingsResponse>;
}

export interface JobsService {
  getJobs(params: GetJobsParams): Promise<GetJobsResponse>;
  getJobById(id: string): Promise<Job | null>;
}

export interface VersionsService {
  getVersions(params: GetVersionsParams): Promise<GetVersionsResponse>;
}

// Request/Response types
export interface GetPairsParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: 'symbol' | 'name' | 'market_cap' | 'volume';
  order?: 'asc' | 'desc';
}

export interface GetPairsResponse {
  pairs: Pair[];
  pagination: Pagination;
}

export interface GetChartsParams {
  version_id?: string;
  pair_id?: string;
  limit?: number;
  offset?: number;
  include_analysis?: boolean;
}

export interface GetChartsResponse {
  charts: Chart[];
  pagination: Pagination;
}

export interface CreateChartParams {
  pair_id: string;
  version_id: string;
  timeframe: string;
  window: string;
  theme: string;
}

export interface CreateChartResponse {
  id: string;
  status: 'processing';
  job_id: string;
  message: string;
}

export interface GetAnalysesParams {
  chart_id?: string;
  provider?: string;
  version_id?: string;
  limit?: number;
  offset?: number;
}

export interface GetAnalysesResponse {
  analyses: ChartAnalysis[];
  pagination: Pagination;
}

export interface RequestAnalysisParams {
  chart_id: string;
  providers: string[];
  options?: {
    include_confidence?: boolean;
    include_countertrend?: boolean;
  };
}

export interface RequestAnalysisResponse {
  id: string;
  status: 'processing';
  job_id: string;
  message: string;
  providers: string[];
}

export interface GetRankingsParams {
  version_id: string;
  provider: string;
  trend_type?: string;
  limit?: number;
  offset?: number;
}

export interface GetRankingsResponse {
  rankings: Ranking[];
  metadata: RankingMetadata;
}

export interface GenerateRankingsParams {
  version_id: string;
  provider: string;
  options?: {
    include_confidence?: boolean;
    include_countertrend?: boolean;
    force_regenerate?: boolean;
  };
}

export interface GenerateRankingsResponse {
  id: string;
  status: 'processing';
  job_id: string;
  message: string;
  estimated_completion?: string;
}

export interface GetJobsParams {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface GetJobsResponse {
  jobs: Job[];
  pagination: Pagination;
}

export interface GetVersionsParams {
  limit?: number;
  offset?: number;
}

export interface GetVersionsResponse {
  versions: Version[];
  pagination: Pagination;
}

// Data models
export interface Pair {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  volume_24h: number;
  price_usd: number;
  change_24h: number;
  created_at: string;
  updated_at: string;
}

export interface Chart {
  id: string;
  version_id: string;
  pair_id: string;
  pair_symbol: string;
  full_image_path: string;
  anonymized_image_path: string;
  captured_at: string;
  timeframe: string;
  window: string;
  theme: string;
  created_at: string;
  updated_at: string;
  analyses?: ChartAnalysis[];
}

export interface ChartAnalysis {
  id: string;
  chart_id: string;
  provider: string;
  model: string;
  schema_version: string;
  trends: Trend[];
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Trend {
  trend: 'Up' | 'Down' | 'Sideways';
  confidence: number;
  countertrend: 'Yes' | 'No' | 'Low';
  ct_confidence: number;
}

export interface Ranking {
  pair: string;
  pair_id: string;
  trend: string;
  trend_confidence: number;
  trend_rank: number;
  countertrend: string;
  ct_confidence: number;
  ct_rank: number;
  rank_sum: number;
  final_rank: number;
}

export interface RankingMetadata {
  version_id: string;
  provider: string;
  total_pairs: number;
  generated_at: string;
}

export interface Job {
  id: string;
  type: 'chart_generation' | 'analysis' | 'ranking';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  metadata: Record<string, any>;
  result?: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface Version {
  id: string;
  name: string;
  description: string;
  status: string;
  pair_count: number;
  chart_count: number;
  analysis_count: number;
  created_at: string;
  activated_at: string;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  request_id: string;
}

// Express request extension
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    apiKey: string;
    permissions: string[];
  };
}

// Middleware types
export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
export type AuthenticatedMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;


