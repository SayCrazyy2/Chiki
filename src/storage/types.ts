export interface SessionRecord {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface MessageRecord {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface SessionRepository {
  listSessions(limit?: number): Promise<SessionRecord[]>;
  listMessages(sessionId: string, limit?: number): Promise<MessageRecord[]>;
}
