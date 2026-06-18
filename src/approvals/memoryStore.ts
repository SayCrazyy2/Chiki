import { randomUUID } from 'node:crypto';

import type { ApprovalDecision, ApprovalRequest, ApprovalStore } from './types.js';

export class InMemoryApprovalStore implements ApprovalStore {
  private readonly requests = new Map<string, ApprovalRequest>();

  create(request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): ApprovalRequest {
    const created: ApprovalRequest = {
      ...request,
      id: randomUUID(),
      createdAt: new Date(),
      status: 'pending'
    };

    this.requests.set(created.id, created);
    return created;
  }

  list(): ApprovalRequest[] {
    return Array.from(this.requests.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  get(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  decide(id: string, decision: ApprovalDecision): ApprovalRequest | undefined {
    const existing = this.requests.get(id);
    if (!existing || existing.status !== 'pending') {
      return existing;
    }

    const updated: ApprovalRequest = {
      ...existing,
      status: decision === 'approve_once' ? 'approved' : 'rejected',
      decision,
      decidedAt: new Date()
    };

    this.requests.set(id, updated);
    return updated;
  }
}
