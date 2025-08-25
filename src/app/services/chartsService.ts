import type { ChartsService, GetChartsParams, GetChartsResponse, CreateChartParams, CreateChartResponse, Chart } from '../types.js';

// Mock data for development
const mockCharts: Chart[] = [
  {
    id: 'chart-123',
    version_id: 'v1.0.0',
    pair_id: 'btc-usdt',
    pair_symbol: 'BTCUSDT',
    full_image_path: '/images/charts/full/btc-usdt-v1.0.0.png',
    anonymized_image_path: '/images/charts/anonymized/btc-usdt-v1.0.0.png',
    captured_at: '2024-08-25T10:30:00.000Z',
    timeframe: '1D',
    window: '1Y',
    theme: 'light',
    created_at: '2024-08-25T10:30:00.000Z',
    updated_at: '2024-08-25T10:30:00.000Z',
  },
  {
    id: 'chart-456',
    version_id: 'v1.0.0',
    pair_id: 'eth-usdt',
    pair_symbol: 'ETHUSDT',
    full_image_path: '/images/charts/full/eth-usdt-v1.0.0.png',
    anonymized_image_path: '/images/charts/anonymized/eth-usdt-v1.0.0.png',
    captured_at: '2024-08-25T10:30:00.000Z',
    timeframe: '1D',
    window: '1Y',
    theme: 'light',
    created_at: '2024-08-25T10:30.0.000Z',
    updated_at: '2024-08-25T10:30:00.000Z',
  },
];

export class MockChartsService implements ChartsService {
  async getCharts(params: GetChartsParams): Promise<GetChartsResponse> {
    const { limit = 50, offset = 0, version_id, pair_id, include_analysis = false } = params;
    
    let filteredCharts = [...mockCharts];
    
    // Apply filters
    if (version_id) {
      filteredCharts = filteredCharts.filter(chart => chart.version_id === version_id);
    }
    
    if (pair_id) {
      filteredCharts = filteredCharts.filter(chart => chart.pair_id === pair_id);
    }
    
    // Apply pagination
    const total = filteredCharts.length;
    const paginatedCharts = filteredCharts.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    // Add analyses if requested (mock data for now)
    if (include_analysis) {
      paginatedCharts.forEach(chart => {
        chart.analyses = [
          {
            id: `analysis-${chart.id}`,
            chart_id: chart.id,
            provider: 'grok',
            model: 'grok-vision-x',
            schema_version: '1.0',
            trends: [
              {
                trend: 'Up',
                confidence: 0.739913,
                countertrend: 'Yes',
                ct_confidence: 0.883369,
              },
            ],
            meta: {
              provider: 'Grok',
              model: 'grok-vision-x',
            },
            created_at: '2024-08-25T10:35:00.000Z',
            updated_at: '2024-08-25T10:35:00.000Z',
          },
        ];
      });
    }
    
    return {
      charts: paginatedCharts,
      pagination: {
        total,
        limit,
        offset,
        has_more: hasMore,
      },
    };
  }

  async getChartById(id: string): Promise<Chart | null> {
    return mockCharts.find(chart => chart.id === id) || null;
  }

  async createChart(params: CreateChartParams): Promise<CreateChartResponse> {
    // Mock chart creation - in real implementation this would start a background job
    const jobId = `job-${Date.now()}`;
    
    return {
      id: `chart-${Date.now()}`,
      status: 'processing',
      job_id: jobId,
      message: 'Chart generation started',
    };
  }
}


