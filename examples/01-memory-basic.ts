/**
 * Basic Memory Example
 *
 * This example demonstrates how to use the MemoryManager
 * to store and retrieve agent memories.
 */

import { MemoryManager, MemoryConfig } from 'microgpt-agent-sdk';

async function main() {
  // Configure memory with in-memory storage for local development
  const config: MemoryConfig = {
    enabled: true,
    shortTerm: {
      provider: 'memory',
      ttl: 3600, // 1 hour
      maxItems: 100
    }
  };

  // Create memory manager
  const memoryManager = new MemoryManager(config);

  const agentId = 'assistant-001';

  // Store some memories
  console.log('Storing memories...');

  await memoryManager.remember(agentId, {
    agentId,
    type: 'transaction',
    content: {
      user: 'Alice',
      message: 'My name is Alice',
      response: 'Nice to meet you, Alice!'
    },
    confidence: 1.0
  });

  await memoryManager.remember(agentId, {
    agentId,
    type: 'decision',
    content: {
      context: 'User asked about their name',
      choice: 'Recall previous conversation',
      reasoning: 'User introduced themselves earlier'
    },
    confidence: 0.95
  });

  await memoryManager.remember(agentId, {
    agentId,
    type: 'pattern',
    content: {
      pattern: 'name_introduction',
      description: 'User introduces themselves'
    },
    confidence: 0.9
  });

  // Recall all memories
  console.log('\nRecalling all memories:');
  const allMemories = await memoryManager.recall(agentId);
  console.log(`Found ${allMemories.length} memories`);
  allMemories.forEach(memory => {
    console.log(`- [${memory.type}] ${JSON.stringify(memory.content)}`);
  });

  // Recall specific type
  console.log('\nRecalling only transactions:');
  const transactions = await memoryManager.recall(agentId, { type: 'transaction' });
  console.log(`Found ${transactions.length} transaction memories`);

  // Get statistics
  console.log('\nMemory statistics:');
  const stats = await memoryManager.getStats(agentId);
  console.log(stats);

  // Learn from outcome
  console.log('\nLearning from outcome...');
  await memoryManager.learn(agentId, {
    transactionId: 'txn_001',
    success: true,
    pattern: 'name_introduction',
    confidence: 0.95
  });

  // Cleanup
  await memoryManager.close();
  console.log('\nMemory manager closed');
}

main().catch(console.error);
