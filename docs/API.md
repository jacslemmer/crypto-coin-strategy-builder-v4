# API Documentation

This document provides comprehensive documentation for the Crypto Coin Strategy Builder API.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Data Models](#data-models)
- [Examples](#examples)

## Overview

The Crypto Coin Strategy Builder API provides endpoints for:

- **Cryptocurrency Data**: Trading pairs, price data, and market information
- **Chart Management**: Screenshot capture, storage, and retrieval
- **Technical Analysis**: AI-powered trend analysis and predictions
- **Job Management**: Background task processing and monitoring
- **System Health**: Service status and monitoring

## Authentication

### API Key Authentication

All API requests require authentication using an API key in the request headers.

```bash
Authorization: Bearer YOUR_API_KEY
```

### Getting an API Key

1. **Local Development**: Use the default key `dev-api-key-12345`
2. **UAT Environment**: Contact the development team
3. **Production**: Request access through the platform

### Security Headers

The API automatically includes security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Base URL

| Environment | Base URL | Description |
|-------------|----------|-------------|
| Local Development | `http://localhost:4000` | Docker development environment |
| UAT | `https://ccsb-api-uat.your-domain.workers.dev` | Cloudflare Workers UAT |
| Production | `https://ccsb-api.your-domain.workers.dev` | Cloudflare Workers production |

## Endpoints

### Health Check

#### GET /health

Check the health status of the API service.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-08-25T10:30:00.000Z",
  "version": "4.0.0",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "redis": "connected",
    "r2": "connected"
  }
}
```

**Status Codes**
- `200` - Service is healthy
- `503` - Service is unhealthy

### Trading Pairs

#### GET /api/pairs

Retrieve a list of trading pairs.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Maximum number of pairs to return (default: 100) |
| `offset` | number | No | Number of pairs to skip (default: 0) |
| `search` | string | No | Search pairs by symbol or name |
| `sort` | string | No | Sort field (symbol, name, market_cap, volume) |
| `order` | string | No | Sort order (asc, desc, default: desc) |

**Response**
```json
{
  "pairs": [
    {
      "id": "btc-usdt",
      "symbol": "BTCUSDT",
      "name": "Bitcoin",
      "market_cap": 500000000000,
      "volume_24h": 25000000000,
      "price_usd": 50000,
      "change_24h": 2.5,
      "created_at": "2024-08-25T10:30:00.000Z",
      "updated_at": "2024-08-25T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}
```

**Status Codes**
- `200` - Success
- `400` - Invalid parameters
- `500` - Internal server error

#### GET /api/pairs/:id

Retrieve a specific trading pair by ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Pair ID (e.g., "btc-usdt") |

**Response**
```json
{
  "id": "btc-usdt",
  "symbol": "BTCUSDT",
  "name": "Bitcoin",
  "market_cap": 500000000000,
  "volume_24h": 25000000000,
  "price_usd": 50000,
  "change_24h": 2.5,
  "created_at": "2024-08-25T10:30:00.000Z",
  "updated_at": "2024-08-25T10:30:00.000Z"
}
```

**Status Codes**
- `200` - Success
- `404` - Pair not found
- `500` - Internal server error

### Charts

#### GET /api/charts

Retrieve chart screenshots and metadata.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `version_id` | string | No | Filter by version ID |
| `pair_id` | string | No | Filter by trading pair ID |
| `limit` | number | No | Maximum number of charts to return (default: 50) |
| `offset` | number | No | Number of charts to skip (default: 0) |
| `include_analysis` | boolean | No | Include analysis data (default: false) |

**Response**
```json
{
  "charts": [
    {
      "id": "chart-123",
      "version_id": "v1.0.0",
      "pair_id": "btc-usdt",
      "pair_symbol": "BTCUSDT",
      "full_image_path": "/images/charts/full/btc-usdt-v1.0.0.png",
      "anonymized_image_path": "/images/charts/anonymized/btc-usdt-v1.0.0.png",
      "captured_at": "2024-08-25T10:30:00.000Z",
      "timeframe": "1D",
      "window": "1Y",
      "theme": "light",
      "created_at": "2024-08-25T10:30:00.000Z",
      "updated_at": "2024-08-25T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 200,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Status Codes**
- `200` - Success
- `400` - Invalid parameters
- `500` - Internal server error

#### GET /api/charts/:id

Retrieve a specific chart by ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Chart ID |

**Response**
```json
{
  "id": "chart-123",
  "version_id": "v1.0.0",
  "pair_id": "btc-usdt",
  "pair_symbol": "BTCUSDT",
  "full_image_path": "/images/charts/full/btc-usdt-v1.0.0.png",
  "anonymized_image_path": "/images/charts/anonymized/btc-usdt-v1.0.0.png",
  "captured_at": "2024-08-25T10:30:00.000Z",
  "timeframe": "1D",
  "window": "1Y",
  "theme": "light",
  "created_at": "2024-08-25T10:30:00.000Z",
  "updated_at": "2024-08-25T10:30:00.000Z",
  "analyses": [
    {
      "id": "analysis-456",
      "provider": "grok",
      "model": "grok-vision-x",
      "trends": [
        {
          "trend": "Up",
          "confidence": 0.739913,
          "countertrend": "Yes",
          "ct_confidence": 0.883369
        }
      ],
      "created_at": "2024-08-25T10:35:00.000Z"
    }
  ]
}
```

**Status Codes**
- `200` - Success
- `404` - Chart not found
- `500` - Internal server error

#### POST /api/charts

Create a new chart screenshot.

**Request Body**
```json
{
  "pair_id": "btc-usdt",
  "version_id": "v1.0.0",
  "timeframe": "1D",
  "window": "1Y",
  "theme": "light"
}
```

**Response**
```json
{
  "id": "chart-123",
  "status": "processing",
  "job_id": "job-789",
  "message": "Chart generation started"
}
```

**Status Codes**
- `202` - Accepted for processing
- `400` - Invalid request body
- `409` - Chart already exists
- `500` - Internal server error

### Chart Analysis

#### GET /api/analysis

Retrieve chart analysis results.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chart_id` | string | No | Filter by chart ID |
| `provider` | string | No | Filter by AI provider (grok, openai, claude, gemini, perplexity) |
| `version_id` | string | No | Filter by version ID |
| `limit` | number | No | Maximum number of analyses to return (default: 50) |
| `offset` | number | No | Number of analyses to skip (default: 0) |

**Response**
```json
{
  "analyses": [
    {
      "id": "analysis-456",
      "chart_id": "chart-123",
      "provider": "grok",
      "model": "grok-vision-x",
      "schema_version": "1.0",
      "trends": [
        {
          "trend": "Up",
          "confidence": 0.739913,
          "countertrend": "Yes",
          "ct_confidence": 0.883369
        },
        {
          "trend": "Down",
          "confidence": 0.320748,
          "countertrend": "No",
          "ct_confidence": 0.592051
        },
        {
          "trend": "Sideways",
          "confidence": 0.739109,
          "countertrend": "Low",
          "ct_confidence": 0.726285
        }
      ],
      "meta": {
        "provider": "Grok",
        "model": "grok-vision-x",
        "notes": "Strong upward trend with high confidence"
      },
      "created_at": "2024-08-25T10:35:00.000Z",
      "updated_at": "2024-08-25T10:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Status Codes**
- `200` - Success
- `400` - Invalid parameters
- `500` - Internal server error

#### POST /api/analysis

Request analysis for a chart.

**Request Body**
```json
{
  "chart_id": "chart-123",
  "providers": ["grok", "openai", "claude"],
  "options": {
    "include_confidence": true,
    "include_countertrend": true
  }
}
```

**Response**
```json
{
  "id": "analysis-request-789",
  "status": "processing",
  "job_id": "job-456",
  "message": "Analysis started for 3 providers",
  "providers": ["grok", "openai", "claude"]
}
```

**Status Codes**
- `202` - Accepted for processing
- `400` - Invalid request body
- `404` - Chart not found
- `500` - Internal server error

### Rankings

#### GET /api/rankings

Retrieve cryptocurrency rankings based on analysis.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `version_id` | string | Yes | Version ID for rankings |
| `provider` | string | Yes | AI provider for analysis |
| `trend_type` | string | No | Filter by trend type (up, down, sideways) |
| `limit` | number | No | Maximum number of rankings to return (default: 100) |
| `offset` | number | No | Number of rankings to skip (default: 0) |

**Response**
```json
{
  "rankings": [
    {
      "pair": "BTCUSDT",
      "pair_id": "btc-usdt",
      "trend": "Up",
      "trend_confidence": 0.739913,
      "trend_rank": 1,
      "countertrend": "Yes",
      "ct_confidence": 0.883369,
      "ct_rank": 1,
      "rank_sum": 2,
      "final_rank": 1
    },
    {
      "pair": "ETHUSDT",
      "pair_id": "eth-usdt",
      "trend": "Up",
      "trend_confidence": 0.689123,
      "trend_rank": 2,
      "countertrend": "No",
      "ct_confidence": 0.592051,
      "ct_rank": 5,
      "rank_sum": 7,
      "final_rank": 2
    }
  ],
  "metadata": {
    "version_id": "v1.0.0",
    "provider": "grok",
    "total_pairs": 200,
    "generated_at": "2024-08-25T10:40:00.000Z"
  }
}
```

**Status Codes**
- `200` - Success
- `400` - Invalid parameters
- `500` - Internal server error

#### POST /api/rankings

Generate new rankings for a version and provider.

**Request Body**
```json
{
  "version_id": "v1.0.0",
  "provider": "grok",
  "options": {
    "include_confidence": true,
    "include_countertrend": true,
    "force_regenerate": false
  }
}
```

**Response**
```json
{
  "id": "rankings-request-123",
  "status": "processing",
  "job_id": "job-789",
  "message": "Rankings generation started",
  "estimated_completion": "2024-08-25T11:00:00.000Z"
}
```

**Status Codes**
- `202` - Accepted for processing
- `400` - Invalid request body
- `409` - Rankings already exist
- `500` - Internal server error

### Jobs

#### GET /api/jobs

Retrieve background job status.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by job status (pending, processing, completed, failed) |
| `type` | string | No | Filter by job type (chart_generation, analysis, ranking) |
| `limit` | number | No | Maximum number of jobs to return (default: 50) |
| `offset` | number | No | Number of jobs to skip (default: 0) |

**Response**
```json
{
  "jobs": [
    {
      "id": "job-789",
      "type": "chart_generation",
      "status": "processing",
      "progress": 75,
      "message": "Generating chart for BTCUSDT",
      "metadata": {
        "pair_id": "btc-usdt",
        "version_id": "v1.0.0"
      },
      "created_at": "2024-08-25T10:30:00.000Z",
      "started_at": "2024-08-25T10:30:05.000Z",
      "completed_at": null,
      "error": null
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

**Status Codes**
- `200` - Success
- `400` - Invalid parameters
- `500` - Internal server error

#### GET /api/jobs/:id

Retrieve a specific job by ID.

**Path Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Job ID |

**Response**
```json
{
  "id": "job-789",
  "type": "chart_generation",
  "status": "completed",
  "progress": 100,
  "message": "Chart generated successfully",
  "metadata": {
    "pair_id": "btc-usdt",
    "version_id": "v1.0.0",
    "chart_id": "chart-123"
  },
  "result": {
    "chart_id": "chart-123",
    "full_image_path": "/images/charts/full/btc-usdt-v1.0.0.png",
    "anonymized_image_path": "/images/charts/anonymized/btc-usdt-v1.0.0.png"
  },
  "created_at": "2024-08-25T10:30:00.000Z",
  "started_at": "2024-08-25T10:30:05.000Z",
  "completed_at": "2024-08-25T10:30:45.000Z",
  "error": null
}
```

**Status Codes**
- `200` - Success
- `404` - Job not found
- `500` - Internal server error

### Versions

#### GET /api/versions

Retrieve application versions.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Maximum number of versions to return (default: 20) |
| `offset` | number | No | Number of versions to skip (default: 0) |

**Response**
```json
{
  "versions": [
    {
      "id": "v1.0.0",
      "name": "Initial Release",
      "description": "First production release with core functionality",
      "status": "active",
      "pair_count": 200,
      "chart_count": 200,
      "analysis_count": 600,
      "created_at": "2024-08-25T10:00:00.000Z",
      "activated_at": "2024-08-25T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

**Status Codes**
- `200` - Success
- `500` - Internal server error

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "pair_id",
        "message": "Pair ID is required"
      }
    ],
    "timestamp": "2024-08-25T10:30:00.000Z",
    "request_id": "req-123456"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_ERROR` | 401 | Authentication required |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Common Error Scenarios

#### Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "limit",
        "message": "Limit must be between 1 and 1000"
      },
      {
        "field": "provider",
        "message": "Provider must be one of: grok, openai, claude, gemini, perplexity"
      }
    ]
  }
}
```

#### Rate Limiting

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "reset_time": "2024-08-25T10:31:00.000Z"
    }
  }
}
```

## Rate Limiting

### Limits by Environment

| Environment | Requests per Hour | Burst Limit |
|-------------|-------------------|-------------|
| Local Development | Unlimited | Unlimited |
| UAT | 1000 | 100 |
| Production | 10000 | 1000 |

### Rate Limit Headers

Response headers include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1692956400
Retry-After: 60
```

### Rate Limit Strategies

- **Exponential Backoff**: Increase delay between retries
- **Jitter**: Add randomness to retry timing
- **Circuit Breaker**: Stop requests if service is failing

## Data Models

### Trading Pair

```typescript
interface TradingPair {
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
```

### Chart

```typescript
interface Chart {
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
}
```

### Chart Analysis

```typescript
interface ChartAnalysis {
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

interface Trend {
  trend: 'Up' | 'Down' | 'Sideways';
  confidence: number;
  countertrend: 'Yes' | 'No' | 'Low';
  ct_confidence: number;
}
```

### Job

```typescript
interface Job {
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
```

## Examples

### Complete Workflow

#### 1. Check Service Health

```bash
curl -X GET "http://localhost:4000/health" \
  -H "Authorization: Bearer dev-api-key-12345"
```

#### 2. Get Trading Pairs

```bash
curl -X GET "http://localhost:4000/api/pairs?limit=10&sort=market_cap&order=desc" \
  -H "Authorization: Bearer dev-api-key-12345"
```

#### 3. Generate Chart

```bash
curl -X POST "http://localhost:4000/api/charts" \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "pair_id": "btc-usdt",
    "version_id": "v1.0.0",
    "timeframe": "1D",
    "window": "1Y",
    "theme": "light"
  }'
```

#### 4. Check Job Status

```bash
curl -X GET "http://localhost:4000/api/jobs/job-789" \
  -H "Authorization: Bearer dev-api-key-12345"
```

#### 5. Request Analysis

```bash
curl -X POST "http://localhost:4000/api/analysis" \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "chart_id": "chart-123",
    "providers": ["grok", "openai"],
    "options": {
      "include_confidence": true,
      "include_countertrend": true
    }
  }'
```

#### 6. Generate Rankings

```bash
curl -X POST "http://localhost:4000/api/rankings" \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "v1.0.0",
    "provider": "grok",
    "options": {
      "include_confidence": true,
      "include_countertrend": true
    }
  }'
```

#### 7. Get Final Rankings

```bash
curl -X GET "http://localhost:4000/api/rankings?version_id=v1.0.0&provider=grok&trend_type=up" \
  -H "Authorization: Bearer dev-api-key-12345"
```

### Error Handling Example

```bash
# Invalid request
curl -X POST "http://localhost:4000/api/charts" \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "invalid_field": "value"
  }'

# Response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "pair_id",
        "message": "Pair ID is required"
      }
    ]
  }
}
```

### Rate Limiting Example

```bash
# After exceeding rate limit
curl -X GET "http://localhost:4000/api/pairs" \
  -H "Authorization: Bearer dev-api-key-12345"

# Response
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 1000,
      "reset_time": "2024-08-25T10:31:00.000Z"
    }
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class CryptoStrategyAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async getPairs(limit = 100, offset = 0) {
    return this.request(`/api/pairs?limit=${limit}&offset=${offset}`);
  }

  async generateChart(pairId: string, versionId: string) {
    return this.request('/api/charts', {
      method: 'POST',
      body: JSON.stringify({
        pair_id: pairId,
        version_id: versionId,
        timeframe: '1D',
        window: '1Y',
        theme: 'light'
      })
    });
  }

  async getJobStatus(jobId: string) {
    return this.request(`/api/jobs/${jobId}`);
  }
}

// Usage
const api = new CryptoStrategyAPI('http://localhost:4000', 'dev-api-key-12345');

// Generate chart and monitor progress
const chartResponse = await api.generateChart('btc-usdt', 'v1.0.0');
const jobId = chartResponse.job_id;

// Poll for completion
while (true) {
  const job = await api.getJobStatus(jobId);
  if (job.status === 'completed') {
    console.log('Chart generated:', job.result);
    break;
  } else if (job.status === 'failed') {
    throw new Error(`Job failed: ${job.error}`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
}
```

### Python

```python
import requests
import time
from typing import Dict, Any

class CryptoStrategyAPI:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def request(self, endpoint: str, method: str = 'GET', data: Dict[str, Any] = None):
        url = f"{self.base_url}{endpoint}"
        
        if method == 'GET':
            response = requests.get(url, headers=self.headers)
        elif method == 'POST':
            response = requests.post(url, headers=self.headers, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")

        if not response.ok:
            error = response.json()
            raise Exception(error['error']['message'])

        return response.json()

    def get_pairs(self, limit: int = 100, offset: int = 0):
        return self.request(f"/api/pairs?limit={limit}&offset={offset}")

    def generate_chart(self, pair_id: str, version_id: str):
        data = {
            'pair_id': pair_id,
            'version_id': version_id,
            'timeframe': '1D',
            'window': '1Y',
            'theme': 'light'
        }
        return self.request('/api/charts', method='POST', data=data)

    def get_job_status(self, job_id: str):
        return self.request(f"/api/jobs/{job_id}")

# Usage
api = CryptoStrategyAPI('http://localhost:4000', 'dev-api-key-12345')

# Generate chart and monitor progress
chart_response = api.generate_chart('btc-usdt', 'v1.0.0')
job_id = chart_response['job_id']

# Poll for completion
while True:
    job = api.get_job_status(job_id)
    if job['status'] == 'completed':
        print(f"Chart generated: {job['result']}")
        break
    elif job['status'] == 'failed':
        raise Exception(f"Job failed: {job['error']}")
    
    time.sleep(5)  # Wait 5 seconds
```

---

**Last Updated**: August 25, 2024  
**Version**: 1.0.0

For more information, see the [deployment guide](DEPLOYMENT.md) or [README](../README.md).


