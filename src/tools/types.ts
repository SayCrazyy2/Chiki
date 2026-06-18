import type { RiskLevel } from '../approvals/types.js';

export interface ToolMetadata {
  name: string;
  version: string;
  description: string;
  permissions: string[];
  risk: RiskLevel;
}

export interface ToolExecutionContext {
  actorId: number;
}

export interface ToolResult {
  ok: boolean;
  output: unknown;
}

export interface Tool<TInput = unknown> {
  readonly metadata: ToolMetadata;
  execute(input: TInput, context: ToolExecutionContext): Promise<ToolResult>;
}
