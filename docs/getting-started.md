# Getting Started with MicroGPT Agent SDK

Welcome to MicroGPT Agent SDK! This guide will help you get up and running quickly.

## Installation

Install the SDK via npm:

```bash
npm install microgpt-agent-sdk
```

Or with yarn:

```bash
yarn add microgpt-agent-sdk
```

## Quick Start

### 1. Basic Memory Usage

The simplest way to get started is with in-memory storage:

```typescript
import { MemoryManager, MemoryConfig } from 'microgpt-agent-sdk';

// Configure in-memory storage (no external dependencies)
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

// Store a memory
await memoryManager.remember('agent-001', {
  agentId: 'agent-001',
  type: 'transaction',
  content: {
    user: 'Alice',
    message: 'Hello!',
    response: 'Hi Alice!'
  },
  confidence: 1.0
});

// Recall memories
const memories = await memoryManager.recall('agent-001');
console.log(memories);
```

### 2. Production Setup with Redis + Supabase

For production, use Redis for fast short-term memory and Supabase for persistent long-term storage:

```typescript
import { MemoryManager, MemoryConfig } from 'microgpt-agent-sdk';

const config: MemoryConfig = {
  enabled: true,
  shortTerm: {
    provider: 'redis',
    ttl: 3600,
    maxItems: 1000,
    connectionString: process.env.REDIS_URL
  },
  longTerm: {
    provider: 'supabase',
    retentionDays: 90,
    connectionString: process.env.SUPABASE_URL
  },
  semantic: {
    provider: 'pinecone',
    dimension: 1536,
    indexName: 'agent-memories',
    apiKey: process.env.PINECONE_API_KEY
  }
};

const memoryManager = new MemoryManager(config);
```

## Configuration

### Memory Types

The SDK supports different types of memories:

- **`transaction`** - User interactions and responses
- **`decision`** - Agent decision-making records
- **`pattern`** - Learned patterns and behaviors
- **`outcome`** - Results and feedback

### Storage Providers

#### Short-Term Memory

Fast, temporary storage for recent context:

- **`memory`** - In-memory (development)
- **`redis`** - Redis (production)

#### Long-Term Memory

Persistent storage for historical data:

- **`supabase`** - Supabase (recommended)
- **`postgresql`** - PostgreSQL
- **`sqlite`** - SQLite (local development)

#### Semantic Memory

Vector storage for pattern matching:

- **`pinecone`** - Pinecone (recommended)
- **`weaviate`** - Weaviate
- **`qdrant`** - Qdrant

## Environment Variables

Set these environment variables for your deployment:

```bash
# Redis
REDIS_URL=redis://localhost:6379

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Pinecone (optional)
PINECONE_API_KEY=your-api-key
PINECONE_ENVIRONMENT=us-west1-gcp
```

## Database Schema

### Supabase Tables

Create these tables in your Supabase project:

```sql
-- Agent memories table
CREATE TABLE agent_memories (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  content JSONB NOT NULL,
  confidence DECIMAL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_memories_agent_id ON agent_memories(agent_id);
CREATE INDEX idx_agent_memories_type ON agent_memories(memory_type);
CREATE INDEX idx_agent_memories_created_at ON agent_memories(created_at);

-- Pattern learning table
CREATE TABLE agent_patterns (
  agent_id TEXT NOT NULL,
  pattern_signature TEXT NOT NULL,
  frequency INTEGER DEFAULT 0,
  success_rate DECIMAL DEFAULT 0,
  confidence DECIMAL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agent_id, pattern_signature)
);
```

## Common Patterns

### Conversational Memory

Store and recall conversation history:

```typescript
// Store user message
await memoryManager.remember(agentId, {
  agentId,
  type: 'transaction',
  content: {
    role: 'user',
    message: 'What\'s the weather?',
    timestamp: new Date()
  },
  confidence: 1.0,
  metadata: { sessionId: 'session_123' }
});

// Store agent response
await memoryManager.remember(agentId, {
  agentId,
  type: 'transaction',
  content: {
    role: 'assistant',
    message: 'It\'s sunny and 72°F',
    timestamp: new Date()
  },
  confidence: 1.0,
  metadata: { sessionId: 'session_123' }
});

// Recall conversation history
const history = await memoryManager.recall(agentId, {
  type: 'transaction',
  limit: 10
});
```

### Pattern Learning

Learn from outcomes to improve agent behavior:

```typescript
// After a successful interaction
await memoryManager.learn(agentId, {
  transactionId: 'txn_123',
  success: true,
  pattern: 'weather_query',
  confidence: 0.95
});

// After a failed interaction
await memoryManager.learn(agentId, {
  transactionId: 'txn_124',
  success: false,
  pattern: 'unclear_request',
  confidence: 0.8
});

// The SDK will automatically update pattern statistics
```

### Memory Cleanup

Implement retention policies:

```typescript
// Forget memories older than 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

await memoryManager.forget(agentId, {
  olderThan: thirtyDaysAgo
});

// Forget low-confidence memories
await memoryManager.forget(agentId, {
  confidenceLessThan: 0.5
});
```

## Next Steps

- [Memory System Guide](./memory.md) - Deep dive into memory architecture
- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](../examples) - Working code examples

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/cogniolab/microgpt-agent-sdk/issues)
- Email: dev@cogniolab.com
