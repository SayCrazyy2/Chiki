import pino from 'pino';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../src/api/app.js';
import { InMemoryApprovalStore } from '../src/approvals/memoryStore.js';
import { EventBus } from '../src/events/bus.js';
import { AuditService } from '../src/services/audit.js';
import { InMemorySessionRepository } from '../src/storage/memorySessionRepository.js';
import { ToolRegistry } from '../src/tools/registry.js';
import type { AppConfig } from '../src/config/env.js';

const config: AppConfig = {
  NODE_ENV: 'test',
  PORT: 3000,
  HOST: '127.0.0.1',
  LOG_LEVEL: 'info',
  TELEGRAM_BOT_TOKEN: 'token',
  TELEGRAM_OWNER_ID: 1,
  DATABASE_URL: 'https://db.example.com',
  WORKSPACE_DIR: process.cwd(),
  OPENAI_BASE_URL: 'https://api.example.com/v1',
  OPENAI_API_KEY: 'key',
  OPENAI_MODEL: 'model',
  OPENAI_FALLBACK_MODEL: undefined,
  PROVIDER_RETRY_ATTEMPTS: 0,
  TERMINAL_TIMEOUT_MS: 20000,
  TERMINAL_ALLOWLIST: 'echo',
  TERMINAL_DENYLIST: 'rm',
  terminalAllowlist: new Set(['echo']),
  terminalDenylist: new Set(['rm'])
};

describe('health endpoints', () => {
  it('returns healthy and ready status', async () => {
    const approvalStore = new InMemoryApprovalStore();
    const eventBus = new EventBus();
    const auditService = new AuditService(pino({ enabled: false }));
    const app = await buildApp({
      config,
      toolRegistry: new ToolRegistry(approvalStore, auditService, eventBus, pino({ enabled: false })),
      approvalStore,
      sessionRepository: new InMemorySessionRepository(),
      eventBus,
      auditService
    });

    const health = await app.inject({ method: 'GET', url: '/healthz' });
    const ready = await app.inject({ method: 'GET', url: '/readyz' });

    expect(health.statusCode).toBe(200);
    expect(ready.statusCode).toBe(200);

    await app.close();
  });
});
