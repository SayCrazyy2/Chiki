import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AppConfig } from '../config/env.js';
import { EventBus } from '../events/bus.js';
import type { ToolRegistry } from '../tools/registry.js';
import type { ApprovalStore } from '../approvals/types.js';
import type { SessionRepository } from '../storage/types.js';
import { healthSchema } from './schemas.js';
import { AuditService } from '../services/audit.js';

export interface AppDeps {
  config: AppConfig;
  toolRegistry: ToolRegistry;
  approvalStore: ApprovalStore;
  sessionRepository: SessionRepository;
  eventBus: EventBus;
  auditService: AuditService;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Chiki API',
        version: '0.1.0'
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs'
  });

  await app.register(websocket);

  app.get('/healthz', {
    schema: {
      response: {
        200: healthSchema
      }
    }
  }, async () => ({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }));

  app.get('/readyz', {
    schema: {
      response: {
        200: healthSchema
      }
    }
  }, async () => ({ status: 'ready', timestamp: new Date().toISOString(), uptime: process.uptime() }));

  app.get('/openapi.json', async () => app.swagger());

  app.get('/api/status', async () => ({
    service: 'chiki',
    environment: deps.config.NODE_ENV,
    tools: deps.toolRegistry.list()
  }));

  app.get('/api/audit', async () => ({ items: deps.auditService.list() }));

  app.get('/api/approvals', async () => ({ items: deps.approvalStore.list() }));

  app.post('/api/approvals/:approvalId/decision', async (request, reply) => {
    const params = z.object({ approvalId: z.string().uuid() }).safeParse(request.params);
    const body = z.object({ decision: z.enum(['approve_once', 'reject']) }).safeParse(request.body);

    if (!params.success || !body.success) {
      return reply.code(400).send({ error: 'Invalid approval decision payload.' });
    }

    const result = deps.toolRegistry.decideApproval(params.data.approvalId, body.data.decision);
    if (!result) {
      return reply.code(404).send({ error: 'Approval request not found.' });
    }

    return { item: result };
  });

  app.post('/api/tools/:toolName/execute', async (request, reply) => {
    const params = z.object({ toolName: z.string().min(1) }).safeParse(request.params);
    const body = z
      .object({ actorId: z.number().int().positive(), input: z.unknown(), reason: z.string().optional() })
      .safeParse(request.body);

    if (!params.success || !body.success) {
      return reply.code(400).send({ error: 'Invalid tool execution payload.' });
    }

    const result = await deps.toolRegistry.execute(
      params.data.toolName,
      body.data.input,
      body.data.actorId,
      body.data.reason
    );

    return result;
  });

  app.get('/api/sessions', async () => ({ items: await deps.sessionRepository.listSessions() }));

  app.get('/api/sessions/:sessionId/messages', async (request, reply) => {
    const params = z.object({ sessionId: z.string().uuid() }).safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Invalid session id.' });
    }

    return { items: await deps.sessionRepository.listMessages(params.data.sessionId) };
  });

  app.get('/ws/events', { websocket: true }, (connection) => {
    const send = (data: unknown) => connection.send(JSON.stringify(data));

    send({ type: 'connection.ready', timestamp: new Date().toISOString() });

    const handler = (event: unknown) => {
      send(event);
    };

    deps.eventBus.on('event', handler);

    connection.on('close', () => {
      deps.eventBus.off('event', handler);
    });
  });

  return app;
}
