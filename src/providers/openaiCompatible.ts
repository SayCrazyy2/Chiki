import OpenAI from 'openai';

import type { AIProvider, ProviderRequest, ProviderResult } from './types.js';

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseURL: string;
  retries: number;
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible';

  private readonly client: OpenAI;

  constructor(private readonly config: OpenAICompatibleConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });
  }

  async *stream(request: ProviderRequest): AsyncGenerator<string, void, void> {
    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: [{ role: 'user', content: request.input }],
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async complete(request: ProviderRequest): Promise<ProviderResult> {
    const completion = await this.client.chat.completions.create({
      model: request.model,
      messages: [{ role: 'user', content: request.input }]
    });

    return {
      text: completion.choices[0]?.message?.content ?? ''
    };
  }

  get retryAttempts() {
    return this.config.retries;
  }
}
