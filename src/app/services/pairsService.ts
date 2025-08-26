import type { PairsService, GetPairsParams, GetPairsResponse, Pair } from '../types.js';

// Mock data for development
const mockPairs: Pair[] = [
  {
    id: 'btc-usdt',
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    market_cap: 500000000000,
    volume_24h: 25000000000,
    price_usd: 50000,
    change_24h: 2.5,
    created_at: '2024-08-25T10:00:00.000Z',
    updated_at: '2024-08-25T10:00:00.000Z',
  },
  {
    id: 'eth-usdt',
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    market_cap: 200000000000,
    volume_24h: 15000000000,
    price_usd: 3000,
    change_24h: 1.8,
    created_at: '2024-08-25T10:00:00.000Z',
    updated_at: '2024-08-25T10:00:00.000Z',
  },
  {
    id: 'bnb-usdt',
    symbol: 'BNBUSDT',
    name: 'BNB',
    market_cap: 50000000000,
    volume_24h: 5000000000,
    price_usd: 400,
    change_24h: -0.5,
    created_at: '2024-08-25T10:00:00.000Z',
    updated_at: '2024-08-25T10:00:00.000Z',
  },
];

export class MockPairsService implements PairsService {
  async getPairs(params: GetPairsParams): Promise<GetPairsResponse> {
    const { limit = 100, offset = 0, search, sort, order = 'desc' } = params;
    
    let filteredPairs = [...mockPairs];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPairs = filteredPairs.filter(pair => 
        pair.symbol.toLowerCase().includes(searchLower) ||
        pair.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    if (sort) {
      filteredPairs.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        switch (sort) {
          case 'symbol':
            aValue = a.symbol;
            bValue = b.symbol;
            break;
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'market_cap':
            aValue = a.market_cap;
            bValue = b.market_cap;
            break;
          case 'volume':
            aValue = a.volume_24h;
            bValue = b.volume_24h;
            break;
          default:
            return 0;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return order === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }
    
    // Apply pagination
    const total = filteredPairs.length;
    const paginatedPairs = filteredPairs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    return {
      pairs: paginatedPairs,
      pagination: {
        total,
        limit,
        offset,
        has_more: hasMore,
      },
    };
  }

  async getPairById(id: string): Promise<Pair | null> {
    return mockPairs.find(pair => pair.id === id) || null;
  }

  async fetchPairs(limit = 15): Promise<{
    success: boolean;
    pairsFetched: number;
    message: string;
    error?: string;
  }> {
    // Mock implementation
    return {
      success: true,
      pairsFetched: Math.min(limit, mockPairs.length),
      message: `Successfully fetched ${Math.min(limit, mockPairs.length)} pairs`,
    };
  }

  async getPairsCount(): Promise<{
    success: boolean;
    count: number;
  }> {
    return {
      success: true,
      count: mockPairs.length,
    };
  }
}
