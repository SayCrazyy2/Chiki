import pino from 'pino';

import type { AppConfig } from './env.js';

export function createLogger(config: Pick<AppConfig, 'LOG_LEVEL' | 'NODE_ENV'>) {
  return pino({
    level: config.LOG_LEVEL,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['req.headers.authorization', '*.OPENAI_API_KEY', '*.TELEGRAM_BOT_TOKEN'],
      remove: true
    },
    transport:
      config.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: { colorize: true }
          }
        : undefined
  });
}
