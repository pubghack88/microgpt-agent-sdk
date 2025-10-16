# MicroGPT Agent SDK

Production-ready TypeScript SDK for building AI agents with advanced memory, multi-agent orchestration, and comprehensive testing capabilities.

## Why MicroGPT Agent SDK?

Building production AI agents requires more than just API calls. You need:

- **Persistent Memory**: Agents that remember conversations across sessions
- **Multi-Agent Coordination**: Orchestrate teams of specialized agents
- **Production Testing**: Test agents with real human feedback before deployment
- **Protocol Flexibility**: Support for MCP, ACP, and other agent protocols
- **Provider Agnostic**: Works with OpenAI, Anthropic, Ollama, and more

MicroGPT Agent SDK provides battle-tested infrastructure so you can focus on building intelligent agent behaviors, not reinventing the wheel.

## Key Features

### 🧠 Advanced Memory System
- **Hybrid Memory**: Combines Redis (short-term), Supabase (long-term), and vector databases (semantic)
- **Automatic Context Management**: Agents remember relevant information across conversations
- **Distributed Memory**: Share memory across multiple agent instances

### 🤝 Multi-Agent Orchestration
- **Message Bus**: Event-driven communication between agents
- **Distributed Locking**: Prevent race conditions in multi-agent systems
- **Shared Context**: Agents collaborate with shared state
- **Workflow Coordination**: Chain agents into complex workflows

### 🧪 Human-in-the-Loop Testing
- **HITL Framework**: Test agents with real human feedback before production
- **Test Orchestration**: Coordinate complex test scenarios
- **Performance Benchmarking**: Measure latency, cost, and quality
- **Integration Testing**: Test entire agent workflows

### 🔌 Protocol Support
- **MCP Adapter**: Model Context Protocol integration
- **ACP Adapter**: Agent Communication Protocol
- **FIPA Adapter**: FIPA agent standards
- **Custom Protocols**: Extend with your own protocols

### 🎯 Provider Flexibility
- **OpenAI**: GPT-4, GPT-3.5-turbo, function calling
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Ollama**: Local model support
- **Unified Interface**: Switch providers without code changes

## Quick Start

### Installation

```bash
npm install microgpt-agent-sdk
```

### Basic Agent

```typescript
import { AgentSDK } from 'microgpt-agent-sdk';

const sdk = new AgentSDK({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

const agent = sdk.createAgent({
  name: 'assistant',
  systemPrompt: 'You are a helpful assistant.'
});

const response = await agent.chat('Hello!');
console.log(response);
```

### Agent with Memory

```typescript
import { AgentSDK, MemoryConfig } from 'microgpt-agent-sdk';

const sdk = new AgentSDK({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  memory: {
    shortTerm: {
      type: 'redis',
      url: process.env.REDIS_URL
    },
    longTerm: {
      type: 'supabase',
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    }
  }
});

const agent = sdk.createAgent({
  name: 'assistant',
  systemPrompt: 'You are a helpful assistant with memory.',
  memoryEnabled: true
});

// Agent remembers context across sessions
await agent.chat('My name is Alice');
// Later...
await agent.chat('What is my name?'); // "Your name is Alice"
```

### Multi-Agent System

```typescript
import { Orchestrator } from 'microgpt-agent-sdk';

const orchestrator = new Orchestrator();

// Create specialized agents
const researcher = orchestrator.createAgent({
  name: 'researcher',
  systemPrompt: 'You research topics thoroughly.'
});

const writer = orchestrator.createAgent({
  name: 'writer',
  systemPrompt: 'You write clear, engaging content.'
});

// Coordinate workflow
const workflow = orchestrator.createWorkflow()
  .step('research', researcher, { task: 'Research AI safety' })
  .step('write', writer, {
    task: 'Write article',
    context: (results) => results.research
  });

const result = await workflow.execute();
```

### Human-in-the-Loop Testing

```typescript
import { TestFramework } from 'microgpt-agent-sdk';

const testFramework = new TestFramework();

// Create test suite
const suite = testFramework.createSuite({
  name: 'Customer Support Agent',
  agent: customerSupportAgent
});

// Add test scenarios
suite.addScenario({
  name: 'Handle refund request',
  input: 'I want a refund for order #12345',
  expectedBehavior: 'Agent should verify order and process refund',
  humanReviewer: true // Request human review
});

// Run tests
const results = await suite.run();
console.log(`Pass rate: ${results.passRate}%`);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MicroGPT Agent SDK                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Memory    │  │ Orchestration│  │   Testing    │      │
│  │              │  │              │  │              │      │
│  │ • Short-term │  │ • Message Bus│  │ • HITL       │      │
│  │ • Long-term  │  │ • Workflows  │  │ • Integration│      │
│  │ • Semantic   │  │ • Locking    │  │ • Performance│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Protocols   │  │   Providers  │  │   Learning   │      │
│  │              │  │              │  │              │      │
│  │ • MCP        │  │ • OpenAI     │  │ • Patterns   │      │
│  │ • ACP        │  │ • Anthropic  │  │ • Optimization│     │
│  │ • FIPA       │  │ • Ollama     │  │ • Analytics  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [Memory System](./docs/memory.md)
- [Multi-Agent Orchestration](./docs/orchestration.md)
- [Testing Framework](./docs/testing.md)
- [Protocol Adapters](./docs/protocols.md)
- [API Reference](./docs/api-reference.md)

## Examples

Check out the [examples](./examples) directory for complete working examples:

- [Basic Agent](./examples/01-basic-agent)
- [Memory System](./examples/02-memory)
- [Multi-Agent Orchestration](./examples/03-multi-agent)
- [HITL Testing](./examples/04-testing)
- [Protocol Integration](./examples/05-protocols)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE)

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/cogniolab/microgpt-agent-sdk/issues)
- Email: dev@cogniolab.com

---

**Built with ❤️ by [Cognio Labs](https://cogniolab.com)**

*MicroGPT Agent SDK is built and maintained by Cognio Labs, creators of production AI agent infrastructure.*
