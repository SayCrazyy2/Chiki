import type { Logger } from 'pino';

import type { ApprovalStore, RiskLevel } from '../approvals/types.js';
import type { EventBus } from '../events/bus.js';
import type { AuditService } from '../services/audit.js';
import type { Tool, ToolResult } from './types.js';

export class ToolRegistry {
  private readonly tools = new Map<string, Tool<unknown>>();

  constructor(
    private readonly approvals: ApprovalStore,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger
  ) {}

  register(tool: Tool<unknown>) {
    this.tools.set(tool.metadata.name, tool);
  }

  list() {
    return Array.from(this.tools.values()).map((tool) => tool.metadata);
  }

  async execute(
    toolName: string,
    input: unknown,
    actorId: number,
    reason = 'Tool execution request'
  ): Promise<ToolResult | { approvalRequired: true; approvalId: string }> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { ok: false, output: { error: `Tool '${toolName}' is not registered.` } };
    }

    if (requiresApproval(tool.metadata.risk)) {
      const commandPreview =
        typeof input === 'object' && input !== null && 'command' in input
          ? String((input as { command: unknown }).command)
          : undefined;
      const filesPreview =
        typeof input === 'object' && input !== null && 'filePath' in input
          ? [String((input as { filePath: unknown }).filePath)]
          : undefined;

      const pending = this.approvals.create({
        toolName,
        risk: tool.metadata.risk,
        reason,
        ...(commandPreview ? { commandPreview } : {}),
        ...(filesPreview ? { filesPreview } : {}),
        rollbackHint: `Review ${toolName} side-effects and restore workspace snapshot if needed.`
      });

      this.eventBus.emitEvent({ type: 'approval.created', approvalId: pending.id, risk: pending.risk });
      this.auditService.log({
        category: 'tool_execution',
        message: 'approval_required',
        metadata: { tool: toolName, approvalId: pending.id, actorId }
      });

      return { approvalRequired: true, approvalId: pending.id };
    }

    const result = await tool.execute(input, { actorId });
    this.auditService.log({
      category: 'tool_execution',
      message: 'tool_executed',
      metadata: { tool: toolName, actorId, success: result.ok }
    });
    this.eventBus.emitEvent({ type: 'tool.executed', tool: toolName, success: result.ok });
    this.logger.info({ tool: toolName, success: result.ok }, 'tool_execution_completed');
    return result;
  }

  decideApproval(approvalId: string, decision: 'approve_once' | 'reject') {
    const updated = this.approvals.decide(approvalId, decision);
    if (!updated) {
      return undefined;
    }

    this.auditService.log({
      category: 'approval_decision',
      message: 'approval_decision_recorded',
      metadata: { approvalId, decision }
    });
    this.eventBus.emitEvent({ type: 'approval.decided', approvalId, decision });
    return updated;
  }
}

function requiresApproval(risk: RiskLevel): boolean {
  return risk === 'high';
}
