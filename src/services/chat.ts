import type { Logger } from 'pino';

import type { AIProvider } from '../providers/types.js';

export interface ChatServiceConfig {
  model: string;
  fallbackModel?: string;
  retryAttempts: number;
}

export class ChatService {
  constructor(
    private readonly provider: AIProvider,
    private readonly config: ChatServiceConfig,
    private readonly logger: Logger
  ) {}

  async *streamReply(input: string): AsyncGenerator<string, void, void> {
    const models = this.config.fallbackModel
      ? [this.config.model, this.config.fallbackModel]
      : [this.config.model];

    for (const model of models) {
      for (let attempt = 0; attempt <= this.config.retryAttempts; attempt += 1) {
        try {
          yield* this.provider.stream({ model, input });
          return;
        } catch (error) {
          this.logger.warn({ error, model, attempt }, 'provider_stream_failed');
          if (attempt >= this.config.retryAttempts) {
            break;
          }
        }
      }
    }

    throw new Error('Unable to complete request with available models.');
  }
}
