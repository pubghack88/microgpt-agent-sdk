import { MemoryManager } from '../src/core/memory/MemoryManager';
import { MemoryConfig, Memory } from '../src/types';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  const agentId = 'test-agent-001';

  beforeEach(() => {
    const config: MemoryConfig = {
      enabled: true,
      shortTerm: {
        provider: 'memory',
        ttl: 3600,
        maxItems: 100
      }
    };

    memoryManager = new MemoryManager(config);
  });

  afterEach(async () => {
    await memoryManager.close();
  });

  describe('remember', () => {
    test('should store a memory and return memory ID', async () => {
      const memory = {
        agentId,
        type: 'transaction' as const,
        content: {
          user: 'Alice',
          message: 'Hello',
          response: 'Hi Alice!'
        },
        confidence: 1.0
      };

      const memoryId = await memoryManager.remember(agentId, memory);

      expect(memoryId).toBeTruthy();
      expect(memoryId).toMatch(/^mem_/);
    });

    test('should store multiple memories', async () => {
      const memory1 = {
        agentId,
        type: 'transaction' as const,
        content: { test: 'data1' },
        confidence: 1.0
      };

      const memory2 = {
        agentId,
        type: 'decision' as const,
        content: { test: 'data2' },
        confidence: 0.9
      };

      const id1 = await memoryManager.remember(agentId, memory1);
      const id2 = await memoryManager.remember(agentId, memory2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('recall', () => {
    beforeEach(async () => {
      // Seed with test data
      await memoryManager.remember(agentId, {
        agentId,
        type: 'transaction',
        content: { test: 'transaction1' },
        confidence: 1.0
      });

      await memoryManager.remember(agentId, {
        agentId,
        type: 'decision',
        content: { test: 'decision1' },
        confidence: 0.9
      });

      await memoryManager.remember(agentId, {
        agentId,
        type: 'pattern',
        content: { test: 'pattern1' },
        confidence: 0.85
      });
    });

    test('should recall all memories', async () => {
      const memories = await memoryManager.recall(agentId);

      expect(memories).toHaveLength(3);
    });

    test('should filter memories by type', async () => {
      const transactions = await memoryManager.recall(agentId, {
        type: 'transaction'
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('transaction');
    });

    test('should limit number of results', async () => {
      const memories = await memoryManager.recall(agentId, {
        limit: 2
      });

      expect(memories.length).toBeLessThanOrEqual(2);
    });

    test('should sort memories by timestamp (newest first)', async () => {
      const memories = await memoryManager.recall(agentId);

      for (let i = 0; i < memories.length - 1; i++) {
        expect(memories[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(memories[i + 1].timestamp.getTime());
      }
    });
  });

  describe('learn', () => {
    test('should create pattern memory from outcome', async () => {
      const outcome = {
        transactionId: 'txn_001',
        success: true,
        pattern: 'greeting',
        confidence: 0.95
      };

      await memoryManager.learn(agentId, outcome);

      const patterns = await memoryManager.recall(agentId, {
        type: 'pattern'
      });

      expect(patterns).toHaveLength(1);
      expect(patterns[0].content.pattern).toBe('greeting');
      expect(patterns[0].content.success).toBe(true);
    });
  });

  describe('forget', () => {
    beforeEach(async () => {
      // Create memories with different timestamps
      const now = new Date();
      const old = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

      await memoryManager.remember(agentId, {
        agentId,
        type: 'transaction',
        content: { test: 'recent' },
        confidence: 1.0
      });

      await memoryManager.remember(agentId, {
        agentId,
        type: 'transaction',
        content: { test: 'old' },
        confidence: 0.4
      });
    });

    test('should forget low-confidence memories', async () => {
      const deletedCount = await memoryManager.forget(agentId, {
        confidenceLessThan: 0.5
      });

      expect(deletedCount).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await memoryManager.remember(agentId, {
        agentId,
        type: 'transaction',
        content: { test: 'data' },
        confidence: 1.0
      });
    });

    test('should return memory statistics', async () => {
      const stats = await memoryManager.getStats(agentId);

      expect(stats).toHaveProperty('shortTermCount');
      expect(stats).toHaveProperty('longTermCount');
      expect(stats).toHaveProperty('patterns');
      expect(stats).toHaveProperty('avgConfidence');
      expect(stats.shortTermCount).toBeGreaterThan(0);
    });
  });

  describe('close', () => {
    test('should cleanup resources without error', async () => {
      await expect(memoryManager.close()).resolves.not.toThrow();
    });
  });
});
