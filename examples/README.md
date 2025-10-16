# MicroGPT Agent SDK Examples

This directory contains working examples demonstrating how to use the MicroGPT Agent SDK.

## Running Examples

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Build the SDK:
```bash
npm run build
```

### Memory Examples

#### 01. Basic Memory (In-Memory)

Simple example using in-memory storage. Perfect for development and testing.

```bash
npx ts-node examples/01-memory-basic.ts
```

**What it demonstrates:**
- Creating a MemoryManager with in-memory storage
- Storing different types of memories (transactions, decisions, patterns)
- Recalling memories with filters
- Learning from outcomes
- Getting memory statistics

#### 02. Redis + Supabase Memory

Production-ready example using Redis for short-term memory and Supabase for long-term persistence.

**Prerequisites:**
- Redis server running locally or accessible via URL
- Supabase project with the following table:

```sql
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

**Environment Variables:**
```bash
export REDIS_URL="redis://localhost:6379"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

**Run:**
```bash
npx ts-node examples/02-memory-redis-supabase.ts
```

**What it demonstrates:**
- Hybrid memory architecture (Redis + Supabase)
- Fast access to recent memories via Redis
- Persistent storage in Supabase
- Pattern learning and recognition
- Memory cleanup and retention policies

## Example Structure

Each example follows this pattern:

1. **Import SDK** - Import required types and classes
2. **Configure** - Set up configuration for the feature
3. **Initialize** - Create instances of SDK components
4. **Demonstrate** - Show key functionality
5. **Cleanup** - Properly close connections

## Next Steps

After running these examples, check out:

- [Documentation](../docs) - Full API reference and guides
- [Tests](../tests) - Unit and integration test examples
- [API Reference](../docs/api-reference.md) - Complete API documentation

## Common Issues

### Redis Connection Error

If you see `Redis connection error`, make sure Redis is running:

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

### Supabase Authentication Error

Make sure you've set the correct environment variables:

```bash
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### TypeScript Errors

Make sure you've built the SDK first:

```bash
npm run build
```

## Contributing

Found an issue or want to add an example? Please open a PR!
