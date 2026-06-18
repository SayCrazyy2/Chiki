import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config/env.js';

describe('loadConfig', () => {
  it('parses a valid config', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      PORT: '3001',
      TELEGRAM_BOT_TOKEN: 'token',
      TELEGRAM_OWNER_ID: '1',
      DATABASE_URL: 'https://database.example.com',
      OPENAI_API_KEY: 'key',
      OPENAI_BASE_URL: 'https://api.example.com/v1'
    });

    expect(config.PORT).toBe(3001);
    expect(config.terminalAllowlist.has('ls')).toBe(true);
  });

  it('throws when required values are missing', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'test'
      })
    ).toThrow();
  });
});
