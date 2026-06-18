import { EventEmitter } from 'node:events';

export type StreamEvent =
  | { type: 'approval.created'; approvalId: string; risk: string }
  | { type: 'approval.decided'; approvalId: string; decision: string }
  | { type: 'tool.executed'; tool: string; success: boolean };

export class EventBus extends EventEmitter {
  emitEvent(event: StreamEvent) {
    this.emit('event', event);
  }
}
