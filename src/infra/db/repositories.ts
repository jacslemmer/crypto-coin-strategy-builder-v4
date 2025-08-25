import { eq, and, desc, asc } from 'drizzle-orm';
import type { Database } from './connection.js';
import * as schema from './schema.js';
import type { NewPair, NewChart, NewChartAnalysis, NewJob, NewVersion, NewImage } from './schema.js';

// Base repository class with common operations
abstract class BaseRepository<T, TNew extends Record<string, any>> {
  constructor(protected db: Database, protected table: any) {}

  async create(data: TNew): Promise<T> {
    const result = await this.db.insert(this.table).values(data).returning();
    if (Array.isArray(result)) {
      return result[0] as T;
    }
    // For D1, result might be a single object
    return result as T;
  }

  async findById(id: string): Promise<T | undefined> {
    const result = await this.db.select().from(this.table).where(eq(this.table.id, id));
    if (Array.isArray(result)) {
      return result[0] as T;
    }
    return result as T;
  }

  async findAll(): Promise<T[]> {
    return await this.db.select().from(this.table);
  }

  async update(id: string, data: Partial<TNew>): Promise<T | undefined> {
    const result = await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(this.table.id, id))
      .returning();
    if (Array.isArray(result)) {
      return result[0] as T;
    }
    return result as T;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(this.table).where(eq(this.table.id, id));
    return 'changes' in result ? result.changes > 0 : false;
  }
}

// Pairs repository
export class PairsRepository extends BaseRepository<schema.Pair, NewPair> {
  constructor(db: Database) {
    super(db, schema.pairs);
  }

  async findBySymbol(symbol: string): Promise<schema.Pair | undefined> {
    const [result] = await this.db.select().from(schema.pairs).where(eq(schema.pairs.symbol, symbol));
    return result;
  }

  async findByRankRange(minRank: number, maxRank: number): Promise<schema.Pair[]> {
    return await this.db
      .select()
      .from(schema.pairs)
      .where(and(eq(schema.pairs.rank, minRank), eq(schema.pairs.rank, maxRank)))
      .orderBy(asc(schema.pairs.rank));
  }

  async findTopByMarketCap(limit: number): Promise<schema.Pair[]> {
    return await this.db
      .select()
      .from(schema.pairs)
      .orderBy(desc(schema.pairs.marketCap))
      .limit(limit);
  }
}

// Charts repository
export class ChartsRepository extends BaseRepository<schema.Chart, NewChart> {
  constructor(db: Database) {
    super(db, schema.charts);
  }

  async findByPairId(pairId: string): Promise<schema.Chart[]> {
    return await this.db.select().from(schema.charts).where(eq(schema.charts.pairId, pairId));
  }

  async findByPairSymbol(pairSymbol: string): Promise<schema.Chart[]> {
    return await this.db.select().from(schema.charts).where(eq(schema.charts.pairSymbol, pairSymbol));
  }

  async findWithAnonymized(): Promise<schema.Chart[]> {
    return await this.db
      .select()
      .from(schema.charts)
      .where(eq(schema.charts.anonymizedChartPath, ''));
  }

  async updateAnonymizedPath(chartId: string, anonymizedPath: string): Promise<schema.Chart | undefined> {
    const [result] = await this.db
      .update(schema.charts)
      .set({ 
        anonymizedChartPath: anonymizedPath, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(schema.charts.id, chartId))
      .returning();
    return result;
  }
}

// Chart analyses repository
export class ChartAnalysesRepository extends BaseRepository<schema.ChartAnalysis, NewChartAnalysis> {
  constructor(db: Database) {
    super(db, schema.chartAnalyses);
  }

  async findByChartId(chartId: string): Promise<schema.ChartAnalysis[]> {
    return await this.db.select().from(schema.chartAnalyses).where(eq(schema.chartAnalyses.chartId, chartId));
  }

  async findByPairId(pairId: string): Promise<schema.ChartAnalysis[]> {
    return await this.db.select().from(schema.chartAnalyses).where(eq(schema.chartAnalyses.pairId, pairId));
  }

  async findByAiName(aiName: string): Promise<schema.ChartAnalysis[]> {
    return await this.db.select().from(schema.chartAnalyses).where(eq(schema.chartAnalyses.aiName, aiName));
  }

  async findTopRanked(limit: number): Promise<schema.ChartAnalysis[]> {
    return await this.db
      .select()
      .from(schema.chartAnalyses)
      .orderBy(asc(schema.chartAnalyses.overallRank))
      .limit(limit);
  }
}

// Jobs repository
export class JobsRepository extends BaseRepository<schema.Job, NewJob> {
  constructor(db: Database) {
    super(db, schema.jobs);
  }

  async findByType(type: schema.Job['type']): Promise<schema.Job[]> {
    return await this.db.select().from(schema.jobs).where(eq(schema.jobs.type, type));
  }

  async findByStatus(status: schema.Job['status']): Promise<schema.Job[]> {
    return await this.db.select().from(schema.jobs).where(eq(schema.jobs.status, status));
  }

  async findByParentId(parentJobId: string): Promise<schema.Job[]> {
    return await this.db.select().from(schema.jobs).where(eq(schema.jobs.parentJobId, parentJobId));
  }

  async updateStatus(id: string, status: schema.Job['status'], error?: string): Promise<schema.Job | undefined> {
    const updateData: Partial<NewJob> = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    
    if (status === 'in_progress') {
      updateData.startedAt = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date().toISOString();
      if (error) {
        updateData.error = error;
      }
    }

    const [result] = await this.db
      .update(schema.jobs)
      .set(updateData)
      .where(eq(schema.jobs.id, id))
      .returning();
    return result;
  }
}

// Versions repository (keeping existing structure)
export class VersionsRepository extends BaseRepository<schema.Version, NewVersion> {
  constructor(db: Database) {
    super(db, schema.versions);
  }

  async findBySource(source: schema.Version['source']): Promise<schema.Version[]> {
    return await this.db.select().from(schema.versions).where(eq(schema.versions.source, source));
  }
}

// Images repository (keeping existing structure)
export class ImagesRepository extends BaseRepository<schema.Image, NewImage> {
  constructor(db: Database) {
    super(db, schema.images);
  }

  async findByVersionId(versionId: string): Promise<schema.Image[]> {
    return await this.db.select().from(schema.images).where(eq(schema.images.versionId, versionId));
  }

  async findByPair(pair: string): Promise<schema.Image[]> {
    return await this.db.select().from(schema.images).where(eq(schema.images.pair, pair));
  }
}

// Main database repository that provides access to all repositories
export class DatabaseRepository {
  public pairs: PairsRepository;
  public charts: ChartsRepository;
  public chartAnalyses: ChartAnalysesRepository;
  public jobs: JobsRepository;
  public versions: VersionsRepository;
  public images: ImagesRepository;

  constructor(db: Database) {
    this.pairs = new PairsRepository(db);
    this.charts = new ChartsRepository(db);
    this.chartAnalyses = new ChartAnalysesRepository(db);
    this.jobs = new JobsRepository(db);
    this.versions = new VersionsRepository(db);
    this.images = new ImagesRepository(db);
  }
}
