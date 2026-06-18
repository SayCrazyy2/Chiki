import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

import type { Tool, ToolResult } from './types.js';
import type { AppConfig } from '../config/env.js';

export interface TerminalInput {
  command: string;
}

export class TerminalTool implements Tool<TerminalInput> {
  readonly metadata = {
    name: 'terminal',
    version: '1.0.0',
    description: 'Execute safe terminal commands with timeout and output capture',
    permissions: ['shell:execute'],
    risk: 'high' as const
  };

  private readonly running = new Map<string, { cancel: () => void }>();

  constructor(private readonly config: AppConfig) {}

  cancelExecution(executionId: string): boolean {
    const run = this.running.get(executionId);
    if (!run) {
      return false;
    }

    run.cancel();
    this.running.delete(executionId);
    return true;
  }

  async execute(input: TerminalInput): Promise<ToolResult> {
    const [program, ...args] = input.command.trim().split(/\s+/);

    if (!program) {
      return { ok: false, output: { error: 'Command must not be empty.' } };
    }

    if (this.config.terminalDenylist.has(program)) {
      return { ok: false, output: { error: `Command '${program}' is denied.` } };
    }

    if (!this.config.terminalAllowlist.has(program)) {
      return { ok: false, output: { error: `Command '${program}' is not in allowlist.` } };
    }

    return await new Promise<ToolResult>((resolve) => {
      const executionId = randomUUID();
      const child = spawn(program, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
      let stdout = '';
      let stderr = '';

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 1000);
      }, this.config.TERMINAL_TIMEOUT_MS);

      this.running.set(executionId, {
        cancel: () => {
          clearTimeout(timeout);
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 1000);
        }
      });

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('close', (code, signal) => {
        clearTimeout(timeout);
        this.running.delete(executionId);
        resolve({
          ok: code === 0,
          output: { executionId, code, signal, stdout: stdout.trim(), stderr: stderr.trim() }
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        this.running.delete(executionId);
        resolve({ ok: false, output: { executionId, error: error.message } });
      });
    });
  }
}
