import type { Tool, ToolResult } from './types.js';

export interface SearchProvider {
  search(query: string): Promise<Array<{ title: string; url: string; snippet: string }>>;
}

export class DuckDuckGoSearchProvider implements SearchProvider {
  async search(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as {
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
      AbstractText?: string;
      AbstractURL?: string;
      Heading?: string;
    };

    const results: Array<{ title: string; url: string; snippet: string }> = [];

    if (data.AbstractURL && data.AbstractText) {
      results.push({ title: data.Heading ?? 'Result', url: data.AbstractURL, snippet: data.AbstractText });
    }

    for (const topic of data.RelatedTopics ?? []) {
      if (topic.FirstURL && topic.Text) {
        results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text });
      }
      if (results.length >= 5) {
        break;
      }
    }

    return results;
  }
}

export class WebSearchTool implements Tool<{ query: string }> {
  readonly metadata = {
    name: 'web_search',
    version: '1.0.0',
    description: 'Web search abstraction with robust error handling',
    permissions: ['network:outbound'],
    risk: 'medium' as const
  };

  constructor(private readonly provider: SearchProvider) {}

  async execute(input: { query: string }): Promise<ToolResult> {
    try {
      const results = await this.provider.search(input.query);
      return { ok: true, output: { results } };
    } catch (error) {
      return {
        ok: false,
        output: {
          error: error instanceof Error ? error.message : 'Search failed unexpectedly.'
        }
      };
    }
  }
}
