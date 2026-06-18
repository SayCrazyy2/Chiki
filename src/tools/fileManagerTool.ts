import fs from 'node:fs/promises';
import path from 'node:path';

import { resolveSafePath } from '../utils/path.js';
import type { Tool, ToolResult } from './types.js';
import type { AppConfig } from '../config/env.js';

export type FileManagerInput =
  | { action: 'read'; filePath: string }
  | { action: 'write'; filePath: string; content: string }
  | { action: 'list'; dirPath?: string }
  | { action: 'search'; dirPath?: string; query: string };

export class FileManagerTool implements Tool<FileManagerInput> {
  readonly metadata = {
    name: 'file_manager',
    version: '1.0.0',
    description: 'Constrained workspace file management',
    permissions: ['filesystem:read', 'filesystem:write'],
    risk: 'medium' as const
  };

  constructor(private readonly config: AppConfig) {}

  async execute(input: FileManagerInput): Promise<ToolResult> {
    try {
      switch (input.action) {
        case 'read': {
          const filePath = resolveSafePath(this.config.WORKSPACE_DIR, input.filePath);
          const content = await fs.readFile(filePath, 'utf8');
          return { ok: true, output: { content } };
        }
        case 'write': {
          const filePath = resolveSafePath(this.config.WORKSPACE_DIR, input.filePath);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, input.content, 'utf8');
          return { ok: true, output: { filePath } };
        }
        case 'list': {
          const dirPath = resolveSafePath(this.config.WORKSPACE_DIR, input.dirPath ?? '.');
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          return {
            ok: true,
            output: {
              entries: entries.map((entry) => ({ name: entry.name, type: entry.isDirectory() ? 'dir' : 'file' }))
            }
          };
        }
        case 'search': {
          const dirPath = resolveSafePath(this.config.WORKSPACE_DIR, input.dirPath ?? '.');
          const results = await searchFiles(dirPath, input.query);
          return { ok: true, output: { matches: results } };
        }
      }
    } catch (error) {
      return {
        ok: false,
        output: {
          error: error instanceof Error ? error.message : 'Unknown file manager error.'
        }
      };
    }
  }
}

async function searchFiles(dirPath: string, query: string): Promise<string[]> {
  const matches: string[] = [];
  const queue = [dirPath];

  while (queue.length > 0 && matches.length < 100) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      const content = await fs.readFile(fullPath, 'utf8').catch(() => '');
      if (content.includes(query)) {
        matches.push(fullPath);
      }
    }
  }

  return matches;
}
