// 基本的な型定義
export type AgentId = string;
export type TaskType = string;

export interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  keywords: string[];
  dependencies?: string[];
  priority: TaskPriority;
  estimatedTime: number;
  canRunInParallel: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export interface AgentConfig {
  agents: Agent[];
}

export interface Task {
  id: string;
  agentId: string;
  priority: TaskPriority;
  dependencies?: string[];
  estimatedTime: number;
  canRunInParallel: boolean;
}

export interface ExecutionPlan {
  id: string;
  phases: ExecutionPhase[];
  totalEstimatedTime: number;
  totalEstimatedDuration: number;
}

export interface ExecutionPhase {
  id: string;
  name: string;
  tasks: Task[];
  canRunInParallel: boolean;
  parallel: boolean;
  estimatedTime: number;
}

export interface Phase {
  id: string;
  name: string;
  tasks: Task[];
  canRunInParallel: boolean;
  parallel: boolean;
  estimatedTime: number;
}

export interface UserInput {
  text: string;
  options?: CLIOptions;
}

export interface InputAnalysis {
  intent: string;
  keywords: string[];
  recommendedAgent?: string;
  confidence: number;
}

export interface AnalysisResult {
  intent: string;
  keywords: string[];
  recommendedAgent?: string;
  confidence: number;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface ExecutionResult {
  agentId: string;
  success: boolean;
  output?: string;
  error?: string;
  files?: string[];
  commands?: CommandResult[];
  filesCreated?: string[];
  commandsExecuted?: CommandResult[];
}

export interface AgentResult {
  agentId: string;
  success: boolean;
  output?: string;
  error?: string;
  filesCreated?: string[];
  commandsExecuted?: CommandResult[];
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface CLIOptions {
  verbose?: boolean;
  dryRun?: boolean;
  parallel?: boolean;
  maxConcurrency?: number;
}
