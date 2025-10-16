/**
 * Redis + Supabase Memory Example
 *
 * This example shows how to configure MemoryManager with
 * Redis (short-term) and Supabase (long-term) for production use.
 *
 * Prerequisites:
 * - Redis server running
 * - Supabase project with agent_memories table
 */

import { MemoryManager, MemoryConfig } from 'microgpt-agent-sdk';

async function main() {
  // Configure hybrid memory architecture
  const config: MemoryConfig = {
    enabled: true,
    shortTerm: {
      provider: 'redis',
      ttl: 3600, // 1 hour
      maxItems: 100,
      connectionString: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    longTerm: {
      provider: 'supabase',
      retentionDays: 90,
      connectionString: process.env.SUPABASE_URL
    }
  };

  const memoryManager = new MemoryManager(config);
  const agentId = 'assistant-prod-001';

  // Store conversation memory
  console.log('Storing conversation in hybrid memory...');

  const memoryId = await memoryManager.remember(agentId, {
    agentId,
    type: 'transaction',
    content: {
      user: 'Bob',
      message: 'What was our last discussion about?',
      response: 'We discussed AI agent memory architectures',
      timestamp: new Date()
    },
    confidence: 1.0,
    metadata: {
      sessionId: 'session_123',
      conversationId: 'conv_456'
    }
  });

  console.log(`Memory stored with ID: ${memoryId}`);

  // Short-term memory will be in Redis (fast access)
  // Long-term memory will be in Supabase (persistent)

  // Recall recent memories (from Redis)
  console.log('\nRecalling recent memories from Redis...');
  const recentMemories = await memoryManager.recall(agentId, {
    limit: 5
  });
  console.log(`Found ${recentMemories.length} recent memories`);

  // Recall older memories (from Supabase)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  console.log('\nRecalling memories from last 2 days (Supabase)...');
  const olderMemories = await memoryManager.recall(agentId, {
    since: twoDaysAgo,
    limit: 20
  });
  console.log(`Found ${olderMemories.length} memories from last 2 days`);

  // Learn and update patterns
  await memoryManager.learn(agentId, {
    transactionId: memoryId,
    success: true,
    pattern: 'conversation_recall',
    confidence: 0.98
  });

  // Get comprehensive stats
  const stats = await memoryManager.getStats(agentId);
  console.log('\nMemory Statistics:');
  console.log(`- Short-term memories: ${stats.shortTermCount} (Redis)`);
  console.log(`- Long-term memories: ${stats.longTermCount} (Supabase)`);
  console.log(`- Learned patterns: ${stats.patterns}`);
  console.log(`- Average confidence: ${stats.avgConfidence.toFixed(2)}`);

  // Forget low-confidence memories older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deletedCount = await memoryManager.forget(agentId, {
    olderThan: thirtyDaysAgo,
    confidenceLessThan: 0.5
  });

  console.log(`\nForgot ${deletedCount} low-confidence memories`);

  // Cleanup
  await memoryManager.close();
}

main().catch(console.error);
