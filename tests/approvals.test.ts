import pino from 'pino';
import { describe, expect, it } from 'vitest';

import { InMemoryApprovalStore } from '../src/approvals/memoryStore.js';
import { EventBus } from '../src/events/bus.js';
import { AuditService } from '../src/services/audit.js';
import { ToolRegistry } from '../src/tools/registry.js';
import type { Tool } from '../src/tools/types.js';

describe('approval decision flow', () => {
  it('creates approval for high risk tool and supports approve/reject decisions', async () => {
    const approvals = new InMemoryApprovalStore();
    const registry = new ToolRegistry(approvals, new AuditService(pino({ enabled: false })), new EventBus(), pino({ enabled: false }));

    const tool: Tool<{ command: string }> = {
      metadata: {
        name: 'danger',
        version: '1.0.0',
        description: 'Dangerous',
        permissions: ['shell:execute'],
        risk: 'high'
      },
      async execute() {
        return { ok: true, output: {} };
      }
    };

    registry.register(tool as Tool<unknown>);

    const first = await registry.execute('danger', { command: 'ls' }, 1);
    expect('approvalRequired' in first && first.approvalRequired).toBe(true);

    if ('approvalRequired' in first) {
      const approved = registry.decideApproval(first.approvalId, 'approve_once');
      expect(approved?.status).toBe('approved');

      const rejectedId = approvals.create({ toolName: 'danger', risk: 'high', reason: 'test' }).id;
      const rejected = registry.decideApproval(rejectedId, 'reject');
      expect(rejected?.status).toBe('rejected');
    }
  });
});
