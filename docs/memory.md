# Memory System Architecture

MicroGPT Agent SDK implements a **hybrid memory architecture** that combines short-term, long-term, and semantic memory layers for optimal performance and persistence.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   MemoryManager                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Short-Term   │  │  Long-Term   │  │  Semantic    │  │
│  │   Memory     │  │   Memory     │  │   Memory     │  │
│  │              │  │              │  │              │  │
│  │   Redis      │  │  Supabase    │  │  Pinecone    │  │
│  │   < 1 hour   │  │  90+ days    │  │  Patterns    │  │
│  │   Fast       │  │  Persistent  │  │  Similarity  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Memory Layers

### 1. Short-Term Memory (Redis)

**Purpose:** Fast access to recent context

**Use Cases:**
- Current conversation context
- Active session data
- Recent user preferences
- Temporary working memory

**Characteristics:**
- TTL-based expiration (default: 1 hour)
- In-memory for sub-millisecond access
- Limited size (configurable max items)
- Automatic cleanup

**Example:**

```typescript
const config: MemoryConfig = {
  enabled: true,
  shortTerm: {
    provider: 'redis',
    ttl: 3600, // 1 hour
    maxItems: 1000,
    connectionString: 'redis://localhost:6379'
  }
};
```

### 2. Long-Term Memory (Supabase)

**Purpose:** Persistent storage of historical data

**Use Cases:**
- User profiles and preferences
- Historical conversations
- Learned patterns
- Performance metrics

**Characteristics:**
- Persistent across restarts
- Queryable with SQL
- Supports complex filters
- Retention policies

**Example:**

```typescript
const config: MemoryConfig = {
  enabled: true,
  longTerm: {
    provider: 'supabase',
    retentionDays: 90,
    connectionString: process.env.SUPABASE_URL
  }
};
```

### 3. Semantic Memory (Vector DB)

**Purpose:** Pattern matching and similarity search

**Use Cases:**
- Finding similar past situations
- Pattern recognition
- Contextual recall
- Intelligent retrieval

**Characteristics:**
- Vector embeddings (1536 dimensions)
- Similarity-based search
- Pattern clustering
- Semantic understanding

**Example:**

```typescript
const config: MemoryConfig = {
  enabled: true,
  semantic: {
    provider: 'pinecone',
    dimension: 1536,
    indexName: 'agent-memories',
    apiKey: process.env.PINECONE_API_KEY
  }
};
```

## Memory Retrieval Strategy

When you call `recall()`, the MemoryManager uses a **cascading strategy**:

```
1. Check Short-Term (Redis)
   ↓ (if not enough results)
2. Query Long-Term (Supabase)
   ↓ (if semantic search requested)
3. Search Semantic (Pinecone)
   ↓
4. Deduplicate and sort
   ↓
5. Return results
```

### Example Flow

```typescript
// Recall with cascading strategy
const memories = await memoryManager.recall('agent-001', {
  type: 'transaction',
  limit: 20,
  since: new Date('2025-01-01')
});

// Steps:
// 1. Redis: Check last 20 transactions (milliseconds)
// 2. Supabase: Query for older transactions (100-200ms)
// 3. Combine and deduplicate
// 4. Sort by timestamp
```

## Memory Types

### Transaction Memory

Records of user interactions:

```typescript
await memoryManager.remember(agentId, {
  agentId,
  type: 'transaction',
  content: {
    input: 'User question',
    output: 'Agent response',
    timestamp: new Date(),
    duration: 250 // ms
  },
  confidence: 1.0
});
```

### Decision Memory

Agent decision-making records:

```typescript
await memoryManager.remember(agentId, {
  agentId,
  type: 'decision',
  content: {
    context: 'User asked unclear question',
    choice: 'Ask for clarification',
    alternatives: ['Guess intent', 'Refuse to answer'],
    reasoning: 'Better UX to clarify than guess wrong'
  },
  confidence: 0.9
});
```

### Pattern Memory

Learned behavioral patterns:

```typescript
await memoryManager.remember(agentId, {
  agentId,
  type: 'pattern',
  content: {
    pattern: 'weather_query',
    frequency: 15,
    successRate: 0.93,
    description: 'User asks about weather'
  },
  confidence: 0.95
});
```

### Outcome Memory

Results and feedback:

```typescript
await memoryManager.remember(agentId, {
  agentId,
  type: 'outcome',
  content: {
    transactionId: 'txn_123',
    success: true,
    userFeedback: 'Helpful response',
    metrics: {
      latency: 180,
      cost: 0.002
    }
  },
  confidence: 1.0
});
```

## Pattern Learning

The SDK includes automatic pattern learning:

```typescript
// After a transaction
await memoryManager.learn(agentId, {
  transactionId: 'txn_123',
  success: true,
  pattern: 'greeting_response',
  confidence: 0.95
});

// This automatically:
// 1. Stores pattern memory
// 2. Updates pattern statistics
// 3. Adjusts confidence scores
// 4. Enables pattern recognition
```

### Pattern Statistics

Track pattern performance over time:

```sql
SELECT
  pattern_signature,
  frequency,
  success_rate,
  confidence
FROM agent_patterns
WHERE agent_id = 'agent-001'
ORDER BY frequency DESC;
```

## Memory Lifecycle

### Store → Retrieve → Learn → Forget

```typescript
// 1. Store
const memoryId = await memoryManager.remember(agentId, memory);

// 2. Retrieve
const memories = await memoryManager.recall(agentId, filters);

// 3. Learn
await memoryManager.learn(agentId, outcome);

// 4. Forget (retention policy)
await memoryManager.forget(agentId, {
  olderThan: thirtyDaysAgo,
  confidenceLessThan: 0.5
});
```

## Performance Optimization

### Caching Strategy

```typescript
// Hot path: Redis (< 1ms)
const recent = await memoryManager.recall(agentId, { limit: 5 });

// Warm path: Supabase (100-200ms)
const historical = await memoryManager.recall(agentId, {
  since: lastWeek,
  limit: 100
});

// Cold path: Semantic search (200-500ms)
const similar = await memoryManager.recall(agentId, {
  type: 'pattern',
  limit: 10
});
```

### Batch Operations

```typescript
// Batch remember
const memoryPromises = conversations.map(conv =>
  memoryManager.remember(agentId, {
    agentId,
    type: 'transaction',
    content: conv,
    confidence: 1.0
  })
);

await Promise.all(memoryPromises);
```

## Advanced Features

### Memory Statistics

Track memory usage and performance:

```typescript
const stats = await memoryManager.getStats(agentId);

console.log(`
  Short-term: ${stats.shortTermCount} memories
  Long-term: ${stats.longTermCount} memories
  Patterns: ${stats.patterns}
  Avg Confidence: ${stats.avgConfidence}
`);
```

### Contextual Recall

Filter memories by context:

```typescript
// Get memories from specific session
const sessionMemories = await memoryManager.recall(agentId, {
  type: 'transaction'
  // Filter by metadata.sessionId in application code
});

// Get recent decision memories
const decisions = await memoryManager.recall(agentId, {
  type: 'decision',
  since: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
  limit: 50
});
```

### Confidence-Based Retrieval

```typescript
// Only recall high-confidence memories
const memories = await memoryManager.recall(agentId);
const highConfidence = memories.filter(m => m.confidence > 0.8);
```

## Best Practices

### 1. Set Appropriate TTLs

```typescript
const config: MemoryConfig = {
  shortTerm: {
    provider: 'redis',
    ttl: 3600,      // 1 hour for chat context
    maxItems: 1000
  }
};
```

### 2. Use Retention Policies

```typescript
// Daily cleanup job
async function cleanupOldMemories() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  await memoryManager.forget(agentId, {
    olderThan: ninetyDaysAgo,
    confidenceLessThan: 0.5
  });
}
```

### 3. Structure Content Consistently

```typescript
// Good: Consistent structure
await memoryManager.remember(agentId, {
  agentId,
  type: 'transaction',
  content: {
    role: 'user' | 'assistant',
    message: string,
    timestamp: Date,
    metadata: object
  },
  confidence: number
});
```

### 4. Monitor Memory Growth

```typescript
// Regular statistics check
setInterval(async () => {
  const stats = await memoryManager.getStats(agentId);

  if (stats.longTermCount > 100000) {
    console.warn('Long-term memory growing large, consider cleanup');
  }
}, 3600000); // hourly
```

## Troubleshooting

### Redis Connection Issues

```typescript
// Add connection error handling
this.redis.on('error', (err) => {
  console.error('Redis error:', err);
  // Fallback to in-memory
  this.config.shortTerm.provider = 'memory';
});
```

### Supabase Query Performance

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_agent_memories_composite
ON agent_memories(agent_id, memory_type, created_at DESC);
```

### Memory Leaks

```typescript
// Always cleanup when done
process.on('SIGTERM', async () => {
  await memoryManager.close();
  process.exit(0);
});
```

## Next Steps

- [Getting Started Guide](./getting-started.md)
- [API Reference](./api-reference.md)
- [Examples](../examples)
