import { buildApp } from './api/app.js';
import { InMemoryApprovalStore } from './approvals/memoryStore.js';
import { createTelegramBot } from './bot/telegramBot.js';
import { loadConfig } from './config/env.js';
import { createLogger } from './config/logger.js';
import { EventBus } from './events/bus.js';
import { OpenAICompatibleProvider } from './providers/openaiCompatible.js';
import { ChatService } from './services/chat.js';
import { AuditService } from './services/audit.js';
import { InMemorySessionRepository } from './storage/memorySessionRepository.js';
import { FileManagerTool } from './tools/fileManagerTool.js';
import { ToolRegistry } from './tools/registry.js';
import { TerminalTool } from './tools/terminalTool.js';
import { DuckDuckGoSearchProvider, WebSearchTool } from './tools/webSearchTool.js';

async function main() {
  const config = loadConfig();
  const logger = createLogger(config);
  const eventBus = new EventBus();
  const approvalStore = new InMemoryApprovalStore();
  const auditService = new AuditService(logger);

  const registry = new ToolRegistry(approvalStore, auditService, eventBus, logger);
  registry.register(new TerminalTool(config));
  registry.register(new FileManagerTool(config));
  registry.register(new WebSearchTool(new DuckDuckGoSearchProvider()));

  const provider = new OpenAICompatibleProvider({
    apiKey: config.OPENAI_API_KEY,
    baseURL: config.OPENAI_BASE_URL,
    retries: config.PROVIDER_RETRY_ATTEMPTS
  });

  const chatConfig = {
    model: config.OPENAI_MODEL,
    retryAttempts: config.PROVIDER_RETRY_ATTEMPTS,
    ...(config.OPENAI_FALLBACK_MODEL ? { fallbackModel: config.OPENAI_FALLBACK_MODEL } : {})
  };

  const chatService = new ChatService(provider, chatConfig, logger);

  const app = await buildApp({
    config,
    toolRegistry: registry,
    approvalStore,
    sessionRepository: new InMemorySessionRepository(),
    eventBus,
    auditService
  });

  const bot = createTelegramBot(config, chatService, logger);

  await app.listen({ host: config.HOST, port: config.PORT });
  logger.info({ host: config.HOST, port: config.PORT }, 'http_server_started');

  await bot.launch();
  logger.info('telegram_bot_started');

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'shutdown_signal_received');
    await Promise.allSettled([app.close(), Promise.resolve(bot.stop(signal))]);
    logger.info('shutdown_complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
