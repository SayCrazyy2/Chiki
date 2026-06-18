import pino from 'pino';

import type { AppConfig } from './env.js';

export function createLogger(config: Pick<AppConfig, 'LOG_LEVEL' | 'NODE_ENV'>) {
  const options: pino.LoggerOptions = {
    level: config.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['req.headers.authorization', '*.OPENAI_API_KEY', '*.TELEGRAM_BOT_TOKEN'],
      remove: true
    }
  };

  if (config.NODE_ENV === 'development') {
    options.transport = {
      target: 'pino-pretty',
      options: { colorize: true }
    };
  }

  return pino(options);
}
