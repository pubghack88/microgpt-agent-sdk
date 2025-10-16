/**
 * Core type definitions for MicroGPT Agent SDK
 */

// Tool Definition
export interface Tool {
  name: string
  description: string
  parameters: Record<string, any>
}

export interface ProviderConfig {
  instructions?: string
  tools?: Tool[]
}

// Agent I/O Types
export interface AgentInput {
  message: string
  additionalInstructions?: string
  sessionId?: string
  context?: Record<string, any>
  files?: Array<{
    name: string
    content: Buffer
    mimeType: string
  }>
}

export interface AgentOutput {
  message: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  metadata?: Record<string, any>
  toolCalls?: Array<{
    name: string
    arguments: Record<string, any>
    result?: any
  }>
}

export interface BaseProvider {
  initialize(): Promise<void>
  execute(input: AgentInput): Promise<AgentOutput>
}

export type ProviderType = 'openai' | 'anthropic' | 'ollama' | 'custom'

// Routing
export interface RouteCondition {
  condition: 'task_type' | 'cost' | 'capability'
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
  provider: ProviderType
}

export interface RouterConfig {
  defaultProvider: ProviderType
  routes: RouteCondition[]
  fallbackProvider?: ProviderType
  maxRetries?: number
}

// Agent Configuration
export interface AgentConfig {
  name: string
  description?: string
  providers: {
    openai?: {
      enabled: boolean
      apiKey: string
      model?: string
    }
    anthropic?: {
      enabled: boolean
      apiKey: string
      model?: string
    }
    ollama?: {
      enabled: boolean
      endpoint: string
      model: string
    }
  }
  routing?: RouterConfig
  memory?: MemoryConfig
  orchestration?: OrchestrationConfig
  learning?: LearningConfig
}

// Memory Management Types
export interface MemoryConfig {
  enabled: boolean
  shortTerm: {
    provider: 'redis' | 'memory'
    ttl: number // seconds
    maxItems?: number
    connectionString?: string
  }
  longTerm?: {
    provider: 'supabase' | 'postgresql' | 'sqlite'
    retentionDays?: number
    connectionString?: string
  }
  semantic?: {
    provider: 'pinecone' | 'weaviate' | 'qdrant'
    dimension: number
    indexName: string
    apiKey?: string
  }
}

export interface Memory {
  id: string
  agentId: string
  timestamp: Date
  type: 'transaction' | 'pattern' | 'decision' | 'outcome'
  content: any
  confidence?: number
  embedding?: number[]
  metadata?: Record<string, any>
}

export interface ShortTermMemory {
  sessionId: string
  transactions: Transaction[]
  decisions: Decision[]
  context: Record<string, any>
  ttl: number
}

export interface LongTermMemory {
  patterns: Pattern[]
  knowledge: Knowledge[]
  performance: PerformanceMetric[]
}

export interface VectorSearchResult {
  id: string
  score: number
  content: string
  metadata?: Record<string, any>
  explanation?: string
}

// State Management Types
export interface AgentState {
  agentId: string
  status: 'idle' | 'processing' | 'waiting' | 'error' | 'learning'
  currentTask?: string
  workload: number
  lastActivity: Date
  capabilities: string[]
  performance: {
    successRate: number
    avgResponseTime: number
    errorRate: number
  }
}

export interface StateTransition {
  from: AgentState['status']
  to: AgentState['status']
  condition?: (context: any) => boolean
  action?: (context: any) => void
}

// Orchestration Types
export interface OrchestrationConfig {
  enabled: boolean
  maxConcurrentAgents?: number
  timeoutMs?: number
  retryPolicy?: RetryPolicy
  loadBalancing?: LoadBalancingStrategy
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  triggers?: WorkflowTrigger[]
  outputs?: WorkflowOutput[]
}

export interface WorkflowStep {
  id: string
  agentId: string
  action: string
  inputs: Record<string, any>
  outputs?: string[]
  conditions?: WorkflowCondition[]
  parallel?: boolean
  timeout?: number
  checkpoint?: boolean
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists'
  value: any
  nextStep?: string
}

// Collaboration Types
export interface CollaborationContext {
  sessionId: string
  workflowId?: string
  participants: string[] // agent IDs
  sharedMemory: Record<string, any>
  messages: AgentMessage[]
  startTime: Date
  endTime?: Date
}

export interface AgentMessage {
  id: string
  from: string // agent ID
  to: string | string[] // agent ID(s) or 'broadcast'
  type: 'request' | 'response' | 'event' | 'error'
  content: any
  timestamp: Date
  correlationId?: string
}

export interface AgentPool {
  name: string
  agents: AgentInstance[]
  loadBalancer: LoadBalancer
}

export interface AgentInstance {
  id: string
  agentId: string
  state: AgentState
  load: number
  lastUsed: Date
}

// Learning Types
export interface LearningConfig {
  enabled: boolean
  mode: 'supervised' | 'reinforcement' | 'unsupervised'
  updateFrequency: 'realtime' | 'batch' | 'scheduled'
  minConfidence: number
  patternThreshold: number
}

export interface Pattern {
  id: string
  agentId: string
  type: 'success' | 'failure' | 'optimization'
  signature: string
  frequency: number
  confidence: number
  lastSeen: Date
  response?: any
}

export interface PerformanceMetric {
  agentId: string
  metricType: string
  value: number
  timestamp: Date
  trend: 'improving' | 'stable' | 'declining'
}

export interface Knowledge {
  id: string
  type: 'rule' | 'fact' | 'procedure'
  content: any
  source: string
  confidence: number
  verified: boolean
  sharedWith: string[] // agent IDs
}

// Helper Types
export interface Transaction {
  id: string
  input: any
  output: any
  timestamp: Date
  duration: number
  success: boolean
}

export interface Decision {
  id: string
  context: any
  choice: any
  confidence: number
  reasoning?: string
  outcome?: 'success' | 'failure' | 'unknown'
}

export interface RetryPolicy {
  maxAttempts: number
  backoffMs: number
  exponential?: boolean
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'least-loaded' | 'random' | 'weighted'
  weights?: Record<string, number>
}

export interface LoadBalancer {
  strategy: LoadBalancingStrategy
  healthCheck: {
    enabled: boolean
    intervalMs: number
    threshold: number
  }
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'manual'
  config: any
}

export interface WorkflowOutput {
  name: string
  type: string
  value: any
}

// Streaming Support Types
export interface StreamableResponse {
  id: string
  status: 'pending' | 'streaming' | 'completed' | 'error'
  chunks: string[]
  progress?: {
    current: number
    total: number
    message?: string
  }
  result?: AgentOutput
  error?: Error
}

export interface StreamOptions {
  onProgress?: (progress: StreamableResponse['progress']) => void
  onChunk?: (chunk: string) => void
  onComplete?: (result: AgentOutput) => void
  onError?: (error: Error) => void
}

// Checkpoint & Resumability Types
export interface WorkflowCheckpoint {
  id: string
  workflowId: string
  stepId: string
  timestamp: Date
  state: Record<string, any>
  completedSteps: string[]
  pendingSteps: string[]
  variables: Record<string, any>
}

export interface ResumeOptions {
  checkpointId?: string
  fromStep?: string
  retryFailed?: boolean
}

// Testing Types
export interface TestScenario {
  id: string
  name: string
  description: string
  input: AgentInput
  expectedBehavior: string
  humanReviewer?: boolean
  metadata?: Record<string, any>
}

export interface TestResult {
  scenarioId: string
  passed: boolean
  actualOutput: AgentOutput
  humanFeedback?: HumanFeedback
  performance: {
    latency: number
    cost: number
  }
  timestamp: Date
}

export interface HumanFeedback {
  reviewer: string
  rating: number
  comments?: string
  suggestions?: string[]
  timestamp: Date
}

// Protocol Adapter Types
export interface ProtocolMessage {
  protocol: 'mcp' | 'acp' | 'fipa'
  performative?: string
  sender: string
  receiver: string
  content: any
  metadata?: Record<string, any>
}
