import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_OWNER_ID: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().url(),
  WORKSPACE_DIR: z.string().default(process.cwd()),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_FALLBACK_MODEL: z.string().optional(),
  PROVIDER_RETRY_ATTEMPTS: z.coerce.number().int().min(0).max(5).default(2),
  TERMINAL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600000).default(20000),
  TERMINAL_ALLOWLIST: z.string().default('ls,pwd,echo,cat,grep,find'),
  TERMINAL_DENYLIST: z.string().default('rm,reboot,shutdown,mkfs,dd,chown,chmod,kill')
});

export type AppConfig = z.infer<typeof envSchema> & {
  terminalAllowlist: Set<string>;
  terminalDenylist: Set<string>;
};

export function loadConfig(overrides?: Partial<NodeJS.ProcessEnv>): AppConfig {
  const raw = envSchema.parse({ ...process.env, ...overrides });

  return {
    ...raw,
    terminalAllowlist: new Set(
      raw.TERMINAL_ALLOWLIST.split(',').map((entry) => entry.trim()).filter(Boolean)
    ),
    terminalDenylist: new Set(
      raw.TERMINAL_DENYLIST.split(',').map((entry) => entry.trim()).filter(Boolean)
    )
  };
}
