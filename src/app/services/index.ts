import { MockPairsService } from './pairsService.js';
import { MockChartsService } from './chartsService.js';
import type { ServerDeps } from '../types.js';

// Mock service implementations for development
export class MockAnalysisService {
  async getAnalyses() {
    return {
      analyses: [],
      pagination: { total: 0, limit: 50, offset: 0, has_more: false },
    };
  }

  async requestAnalysis() {
    return {
      id: `analysis-request-${Date.now()}`,
      status: 'processing' as const,
      job_id: `job-${Date.now()}`,
      message: 'Analysis started',
      providers: ['grok'],
    };
  }
}

export class MockRankingsService {
  async getRankings() {
    return {
      rankings: [],
      metadata: {
        version_id: 'v1.0.0',
        provider: 'grok',
        total_pairs: 0,
        generated_at: new Date().toISOString(),
      },
    };
  }

  async generateRankings() {
    return {
      id: `rankings-request-${Date.now()}`,
      status: 'processing' as const,
      job_id: `job-${Date.now()}`,
      message: 'Rankings generation started',
      estimated_completion: new Date(Date.now() + 60000).toISOString(),
    };
  }
}

export class MockJobsService {
  async getJobs() {
    return {
      jobs: [],
      pagination: { total: 0, limit: 50, offset: 0, has_more: false },
    };
  }

  async getJobById() {
    return null;
  }
}

export class MockVersionsService {
  async getVersions() {
    return {
      versions: [
        {
          id: 'v1.0.0',
          name: 'Initial Release',
          description: 'First production release with core functionality',
          status: 'active',
          pair_count: 200,
          chart_count: 200,
          analysis_count: 600,
          created_at: '2024-08-25T10:00:00.000Z',
          activated_at: '2024-08-25T10:00:00.000Z',
        },
      ],
      pagination: { total: 1, limit: 20, offset: 0, has_more: false },
    };
  }
}

// Service factory
export function createMockServices(): ServerDeps {
  return {
    pairsService: new MockPairsService(),
    chartsService: new MockChartsService(),
    analysisService: new MockAnalysisService(),
    rankingsService: new MockRankingsService(),
    jobsService: new MockJobsService(),
    versionsService: new MockVersionsService(),
  };
}
