import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';
import {
  Memory,
  MemoryConfig,
  ShortTermMemory,
  LongTermMemory,
  Pattern,
  Knowledge,
  PerformanceMetric,
  Transaction,
  Decision
} from '../../types';

/**
 * MemoryManager provides hybrid memory architecture for AI agents
 * combining short-term (Redis), long-term (Supabase), and semantic (vector) memory
 */
export class MemoryManager {
  private config: MemoryConfig;
  private supabase?: SupabaseClient;
  private redis?: Redis;
  private inMemoryCache: Map<string, any>;

  constructor(config: MemoryConfig) {
    this.config = config;
    this.inMemoryCache = new Map();
    this.initialize();
  }

  private async initialize() {
    // Initialize Redis for short-term memory
    if (this.config.shortTerm.provider === 'redis') {
      const redisUrl = this.config.shortTerm.connectionString || process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl);

      this.redis.on('error', (err) => {
        console.error('Redis connection error:', err);
        // Fallback to in-memory cache
        this.config.shortTerm.provider = 'memory';
      });
    }

    // Initialize Supabase for long-term memory
    if (this.config.longTerm?.provider === 'supabase') {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      } else {
        console.warn('Supabase credentials not found, using in-memory storage');
      }
    }
  }

  /**
   * Store memory with hybrid approach across short-term, long-term, and semantic layers
   */
  async remember(agentId: string, memory: Omit<Memory, 'id' | 'timestamp'>): Promise<string> {
    const fullMemory: Memory = {
      ...memory,
      id: this.generateId(),
      agentId,
      timestamp: new Date()
    };

    // Store in short-term memory for fast access
    await this.storeShortTerm(fullMemory);

    // Store in long-term memory for persistence
    if (this.config.longTerm) {
      await this.storeLongTerm(fullMemory);
    }

    // If semantic memory is configured, store embeddings
    if (this.config.semantic && memory.embedding) {
      await this.storeSemanticMemory(fullMemory);
    }

    return fullMemory.id;
  }

  /**
   * Recall memories using multi-layer approach:
   * 1. Check short-term (fastest)
   * 2. Query long-term (persistent)
   * 3. Semantic search (pattern matching)
   */
  async recall(
    agentId: string,
    query: {
      type?: Memory['type'];
      limit?: number;
      since?: Date;
      sessionId?: string;
    } = {}
  ): Promise<Memory[]> {
    const memories: Memory[] = [];

    // 1. Check short-term memory first (fastest)
    const shortTermMemories = await this.queryShortTerm(agentId, query);
    memories.push(...shortTermMemories);

    // 2. If not enough results, query long-term memory
    if (memories.length < (query.limit || 10) && this.config.longTerm) {
      const longTermMemories = await this.queryLongTerm(agentId, query);
      memories.push(...longTermMemories);
    }

    // 3. If semantic search is needed
    if (query.type === 'pattern' && this.config.semantic) {
      const semanticMemories = await this.querySemanticMemory(agentId, query);
      memories.push(...semanticMemories);
    }

    // Remove duplicates and sort by timestamp
    const uniqueMemories = this.deduplicateMemories(memories);
    return uniqueMemories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Store in short-term memory (Redis or in-memory)
   */
  private async storeShortTerm(memory: Memory): Promise<void> {
    const key = `memory:${memory.agentId}:${memory.id}`;
    const ttl = this.config.shortTerm.ttl;

    if (this.redis) {
      await this.redis.setex(key, ttl, JSON.stringify(memory));

      // Add to agent's memory list
      const listKey = `memories:${memory.agentId}`;
      await this.redis.lpush(listKey, memory.id);
      await this.redis.ltrim(listKey, 0, this.config.shortTerm.maxItems || 100);
      await this.redis.expire(listKey, ttl);
    } else {
      // Fallback to in-memory cache
      this.inMemoryCache.set(key, memory);

      // Simple TTL implementation
      setTimeout(() => {
        this.inMemoryCache.delete(key);
      }, ttl * 1000);
    }
  }

  /**
   * Store in long-term memory (Supabase)
   */
  private async storeLongTerm(memory: Memory): Promise<void> {
    if (!this.supabase) {
      // Fallback to in-memory for development
      const key = `longterm:${memory.agentId}:${memory.id}`;
      this.inMemoryCache.set(key, memory);
      return;
    }

    try {
      const { error } = await this.supabase
        .from('agent_memories')
        .insert({
          id: memory.id,
          agent_id: memory.agentId,
          memory_type: memory.type,
          content: memory.content,
          confidence: memory.confidence,
          embedding: memory.embedding,
          metadata: memory.metadata,
          created_at: memory.timestamp
        });

      if (error) {
        console.error('Error storing long-term memory:', error);
      }
    } catch (err) {
      console.error('Failed to store in Supabase:', err);
    }
  }

  /**
   * Store semantic memory for pattern matching
   * In production, this would integrate with Pinecone/Weaviate/Qdrant
   */
  private async storeSemanticMemory(memory: Memory): Promise<void> {
    if (memory.embedding && memory.embedding.length > 0) {
      const key = `semantic:${memory.agentId}:${memory.id}`;
      this.inMemoryCache.set(key, {
        embedding: memory.embedding,
        metadata: {
          id: memory.id,
          type: memory.type,
          confidence: memory.confidence
        }
      });
    }
  }

  /**
   * Query short-term memory
   */
  private async queryShortTerm(agentId: string, query: any): Promise<Memory[]> {
    const memories: Memory[] = [];

    if (this.redis) {
      const listKey = `memories:${agentId}`;
      const memoryIds = await this.redis.lrange(listKey, 0, query.limit || 10);

      for (const id of memoryIds) {
        const key = `memory:${agentId}:${id}`;
        const data = await this.redis.get(key);
        if (data) {
          const memory = JSON.parse(data);
          if (this.matchesQuery(memory, query)) {
            memories.push(memory);
          }
        }
      }
    } else {
      // Query in-memory cache
      for (const [key, value] of this.inMemoryCache.entries()) {
        if (key.startsWith(`memory:${agentId}:`)) {
          if (this.matchesQuery(value, query)) {
            memories.push(value);
          }
        }
      }
    }

    return memories;
  }

  /**
   * Query long-term memory
   */
  private async queryLongTerm(agentId: string, query: any): Promise<Memory[]> {
    if (!this.supabase) {
      // Query in-memory fallback
      const memories: Memory[] = [];
      for (const [key, value] of this.inMemoryCache.entries()) {
        if (key.startsWith(`longterm:${agentId}:`)) {
          if (this.matchesQuery(value, query)) {
            memories.push(value);
          }
        }
      }
      return memories;
    }

    try {
      let supabaseQuery = this.supabase
        .from('agent_memories')
        .select('*')
        .eq('agent_id', agentId);

      if (query.type) {
        supabaseQuery = supabaseQuery.eq('memory_type', query.type);
      }

      if (query.since) {
        supabaseQuery = supabaseQuery.gte('created_at', query.since.toISOString());
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Error querying long-term memory:', error);
        return [];
      }

      return data?.map(row => ({
        id: row.id,
        agentId: row.agent_id,
        timestamp: new Date(row.created_at),
        type: row.memory_type,
        content: row.content,
        confidence: row.confidence,
        embedding: row.embedding,
        metadata: row.metadata
      })) || [];
    } catch (err) {
      console.error('Failed to query Supabase:', err);
      return [];
    }
  }

  /**
   * Query semantic memory using vector similarity
   */
  private async querySemanticMemory(agentId: string, query: any): Promise<Memory[]> {
    // This would use vector similarity search in production
    // For now, return pattern-type memories
    const memories: Memory[] = [];

    for (const [key, value] of this.inMemoryCache.entries()) {
      if (key.startsWith(`semantic:${agentId}:`)) {
        if (value.metadata.type === 'pattern') {
          memories.push(value);
        }
      }
    }

    return memories;
  }

  /**
   * Learn from outcomes and update patterns
   */
  async learn(agentId: string, outcome: {
    transactionId: string;
    success: boolean;
    pattern?: string;
    confidence: number;
  }): Promise<void> {
    // Store as a pattern memory
    await this.remember(agentId, {
      agentId,
      type: 'pattern',
      content: {
        transactionId: outcome.transactionId,
        success: outcome.success,
        pattern: outcome.pattern
      },
      confidence: outcome.confidence,
      metadata: {
        learned: true,
        timestamp: new Date()
      }
    });

    // Update pattern recognition
    if (outcome.pattern) {
      await this.updatePattern(agentId, outcome.pattern, outcome.success);
    }
  }

  /**
   * Update pattern statistics
   */
  private async updatePattern(agentId: string, pattern: string, success: boolean): Promise<void> {
    const key = `pattern:${agentId}:${pattern}`;

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('agent_patterns')
          .upsert({
            agent_id: agentId,
            pattern_signature: pattern,
            frequency: 1,
            success_rate: success ? 1 : 0,
            last_updated: new Date()
          }, {
            onConflict: 'agent_id,pattern_signature',
            count: 'exact'
          });

        if (error) {
          console.error('Error updating pattern:', error);
        }
      } catch (err) {
        console.error('Failed to update pattern:', err);
      }
    } else {
      // In-memory pattern tracking
      const existing = this.inMemoryCache.get(key) || { frequency: 0, successes: 0 };
      existing.frequency++;
      if (success) existing.successes++;
      this.inMemoryCache.set(key, existing);
    }
  }

  /**
   * Forget old or irrelevant memories
   */
  async forget(agentId: string, criteria: {
    olderThan?: Date;
    type?: Memory['type'];
    confidenceLessThan?: number;
  }): Promise<number> {
    let deletedCount = 0;

    if (this.supabase) {
      try {
        let query = this.supabase
          .from('agent_memories')
          .delete()
          .eq('agent_id', agentId);

        if (criteria.olderThan) {
          query = query.lt('created_at', criteria.olderThan.toISOString());
        }

        if (criteria.type) {
          query = query.eq('memory_type', criteria.type);
        }

        if (criteria.confidenceLessThan !== undefined) {
          query = query.lt('confidence', criteria.confidenceLessThan);
        }

        const { data, error } = await query.select('id');

        if (error) {
          console.error('Error forgetting memories:', error);
        } else {
          deletedCount = data?.length || 0;
        }
      } catch (err) {
        console.error('Failed to forget memories:', err);
      }
    }

    // Clean up in-memory cache
    for (const [key, value] of this.inMemoryCache.entries()) {
      if (key.includes(agentId) && this.matchesForgetCriteria(value, criteria)) {
        this.inMemoryCache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get memory statistics for an agent
   */
  async getStats(agentId: string): Promise<{
    shortTermCount: number;
    longTermCount: number;
    patterns: number;
    avgConfidence: number;
  }> {
    let stats = {
      shortTermCount: 0,
      longTermCount: 0,
      patterns: 0,
      avgConfidence: 0
    };

    // Count short-term memories
    if (this.redis) {
      const listKey = `memories:${agentId}`;
      stats.shortTermCount = await this.redis.llen(listKey);
    }

    // Count long-term memories
    if (this.supabase) {
      const { count } = await this.supabase
        .from('agent_memories')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      stats.longTermCount = count || 0;

      // Get pattern count and avg confidence
      const { data } = await this.supabase
        .from('agent_patterns')
        .select('confidence')
        .eq('agent_id', agentId);

      if (data && data.length > 0) {
        stats.patterns = data.length;
        stats.avgConfidence = data.reduce((sum, p) => sum + p.confidence, 0) / data.length;
      }
    }

    return stats;
  }

  /**
   * Helper: Check if memory matches query
   */
  private matchesQuery(memory: Memory, query: any): boolean {
    if (query.type && memory.type !== query.type) return false;
    if (query.since && memory.timestamp < query.since) return false;
    return true;
  }

  /**
   * Helper: Check if memory matches forget criteria
   */
  private matchesForgetCriteria(memory: any, criteria: any): boolean {
    if (criteria.olderThan && memory.timestamp < criteria.olderThan) return true;
    if (criteria.type && memory.type === criteria.type) return true;
    if (criteria.confidenceLessThan && memory.confidence < criteria.confidenceLessThan) return true;
    return false;
  }

  /**
   * Helper: Remove duplicate memories
   */
  private deduplicateMemories(memories: Memory[]): Memory[] {
    const seen = new Set<string>();
    return memories.filter(memory => {
      if (seen.has(memory.id)) return false;
      seen.add(memory.id);
      return true;
    });
  }

  /**
   * Helper: Generate unique memory ID
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources (close connections)
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.inMemoryCache.clear();
  }
}

export default MemoryManager;
