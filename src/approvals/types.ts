export type RiskLevel = 'low' | 'medium' | 'high';

export type ApprovalDecision = 'approve_once' | 'reject';

export interface ApprovalRequest {
  id: string;
  createdAt: Date;
  toolName: string;
  risk: RiskLevel;
  reason: string;
  commandPreview?: string;
  filesPreview?: string[];
  rollbackHint?: string;
  status: 'pending' | 'approved' | 'rejected';
  decision?: ApprovalDecision;
  decidedAt?: Date;
}

export interface ApprovalStore {
  create(request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): ApprovalRequest;
  list(): ApprovalRequest[];
  get(id: string): ApprovalRequest | undefined;
  decide(id: string, decision: ApprovalDecision): ApprovalRequest | undefined;
}
