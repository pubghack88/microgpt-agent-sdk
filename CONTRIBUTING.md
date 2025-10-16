# Contributing to MicroGPT Agent SDK

Thank you for your interest in contributing to MicroGPT Agent SDK! We welcome contributions from the community.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check [existing issues](https://github.com/cogniolab/microgpt-agent-sdk/issues)
2. If not found, [create a new issue](https://github.com/cogniolab/microgpt-agent-sdk/issues/new)
3. Provide:
   - Clear description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure tests pass: `npm test`
6. Format code: `npm run format`
7. Commit changes: `git commit -m "Add: your feature description"`
8. Push to fork: `git push origin feature/your-feature-name`
9. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup Steps

```bash
# Clone repository
git clone https://github.com/cogniolab/microgpt-agent-sdk.git
cd microgpt-agent-sdk

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Format code
npm run format

# Lint code
npm run lint
```

### Optional: Set up test services

For full integration testing:

```bash
# Start Redis
docker run -d -p 6379:6379 redis:latest

# Set up Supabase (create project at supabase.com)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

## Code Style

- Follow existing code patterns
- Use TypeScript with strict type checking
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small

### TypeScript Guidelines

```typescript
// Good: Clear types, good naming
async function storeMemory(
  agentId: string,
  memory: Memory
): Promise<string> {
  // Implementation
}

// Bad: Unclear types, vague naming
async function store(id: any, data: any): Promise<any> {
  // Implementation
}
```

## Testing

### Writing Tests

- Write unit tests for all new functionality
- Use Jest for testing framework
- Mock external dependencies (Redis, Supabase)
- Aim for >80% code coverage

Example test:

```typescript
import { MemoryManager } from '../src/core/memory/MemoryManager';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager({
      enabled: true,
      shortTerm: {
        provider: 'memory',
        ttl: 3600,
        maxItems: 100
      }
    });
  });

  afterEach(async () => {
    await memoryManager.close();
  });

  test('should store and recall memory', async () => {
    const agentId = 'test-agent';
    const memory = {
      agentId,
      type: 'transaction' as const,
      content: { test: 'data' },
      confidence: 1.0
    };

    const memoryId = await memoryManager.remember(agentId, memory);
    expect(memoryId).toBeTruthy();

    const recalled = await memoryManager.recall(agentId);
    expect(recalled).toHaveLength(1);
    expect(recalled[0].content).toEqual({ test: 'data' });
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

## Documentation

- Update documentation for new features
- Add examples for new functionality
- Keep README up to date
- Add JSDoc comments for public APIs

### Documentation Structure

```
docs/
  ├── getting-started.md   # Quick start guide
  ├── memory.md            # Memory system details
  ├── orchestration.md     # Multi-agent coordination
  ├── testing.md           # Testing framework
  ├── protocols.md         # Protocol adapters
  └── api-reference.md     # Complete API docs
```

## Areas We'd Love Help With

1. **Core Features**
   - State management system
   - Multi-agent orchestration
   - Testing framework
   - Protocol adapters (MCP, ACP, FIPA)

2. **Integrations**
   - Additional vector database providers
   - More AI provider integrations
   - Cloud deployment templates

3. **Documentation**
   - More examples
   - Tutorial videos
   - API documentation
   - Architecture diagrams

4. **Testing**
   - Integration tests
   - Performance benchmarks
   - Load testing

5. **DevOps**
   - CI/CD improvements
   - Docker configurations
   - Kubernetes deployments

## Commit Message Guidelines

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build process or tooling changes

Examples:

```
feat: Add pattern learning to MemoryManager
fix: Resolve Redis connection timeout issue
docs: Update getting started guide
test: Add integration tests for memory system
```

## Code Review Process

1. All PRs require review from maintainers
2. CI checks must pass
3. Tests must maintain or improve coverage
4. Documentation must be updated
5. Changes should follow existing patterns

## Community Guidelines

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on collaboration
- Give credit where due

## Questions?

- GitHub Discussions: [Ask questions](https://github.com/cogniolab/microgpt-agent-sdk/discussions)
- Email: dev@cogniolab.com

Thank you for contributing to MicroGPT Agent SDK! 🎉
