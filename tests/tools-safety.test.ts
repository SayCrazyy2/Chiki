import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { FileManagerTool } from '../src/tools/fileManagerTool.js';
import { TerminalTool } from '../src/tools/terminalTool.js';
import type { AppConfig } from '../src/config/env.js';

function testConfig(workspaceDir: string): AppConfig {
  return {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '127.0.0.1',
    LOG_LEVEL: 'info',
    TELEGRAM_BOT_TOKEN: 'token',
    TELEGRAM_OWNER_ID: 1,
    DATABASE_URL: 'https://db.example.com',
    WORKSPACE_DIR: workspaceDir,
    OPENAI_BASE_URL: 'https://api.example.com/v1',
    OPENAI_API_KEY: 'key',
    OPENAI_MODEL: 'model',
    OPENAI_FALLBACK_MODEL: undefined,
    PROVIDER_RETRY_ATTEMPTS: 0,
    TERMINAL_TIMEOUT_MS: 5000,
    TERMINAL_ALLOWLIST: 'echo',
    TERMINAL_DENYLIST: 'rm',
    terminalAllowlist: new Set(['echo']),
    terminalDenylist: new Set(['rm'])
  };
}

describe('tool safety constraints', () => {
  it('blocks denied terminal command and non-allowlisted command', async () => {
    const tool = new TerminalTool(testConfig(process.cwd()));
    const denied = await tool.execute({ command: 'rm -rf /' });
    const blocked = await tool.execute({ command: 'ls -la' });

    expect(denied.ok).toBe(false);
    expect(blocked.ok).toBe(false);
  });

  it('prevents path traversal in file manager', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'chiki-workspace-'));
    const tool = new FileManagerTool(testConfig(workspace));

    const result = await tool.execute({ action: 'read', filePath: '../outside.txt' });
    expect(result.ok).toBe(false);
    expect((result.output as { error: string }).error).toContain('Path traversal');
  });
});
