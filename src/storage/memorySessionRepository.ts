import { randomUUID } from 'node:crypto';

import type { MessageRecord, SessionRecord, SessionRepository } from './types.js';

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions: SessionRecord[] = [
    {
      id: randomUUID(),
      userId: 'owner',
      createdAt: new Date()
    }
  ];

  private readonly messages: MessageRecord[] = [];

  async listSessions(limit = 20): Promise<SessionRecord[]> {
    return this.sessions.slice(0, limit);
  }

  async listMessages(sessionId: string, limit = 50): Promise<MessageRecord[]> {
    return this.messages.filter((message) => message.sessionId === sessionId).slice(0, limit);
  }
}
