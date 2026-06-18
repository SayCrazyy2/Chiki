import type { Logger } from 'pino';

export interface AuditRecord {
  category: 'tool_execution' | 'approval_decision';
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export class AuditService {
  private readonly records: AuditRecord[] = [];

  constructor(private readonly logger: Logger) {}

  log(record: Omit<AuditRecord, 'timestamp'>) {
    const full: AuditRecord = { ...record, timestamp: new Date().toISOString() };
    this.records.unshift(full);
    this.logger.info({ audit: full }, 'audit_event');
  }

  list(limit = 100): AuditRecord[] {
    return this.records.slice(0, limit);
  }
}
