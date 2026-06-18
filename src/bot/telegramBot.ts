import { Telegraf } from 'telegraf';
import type { Logger } from 'pino';

import type { AppConfig } from '../config/env.js';
import { ChatService } from '../services/chat.js';

export function createTelegramBot(config: AppConfig, chatService: ChatService, logger: Logger) {
  const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

  const guardOwner = async (ctx: Parameters<typeof bot.on>[1] extends (...args: infer A) => unknown ? A[0] : never) => {
    if (ctx.from?.id !== config.TELEGRAM_OWNER_ID) {
      logger.warn({ userId: ctx.from?.id, updateType: ctx.updateType }, 'telegram_unauthorized_access');
      await ctx.reply('Unauthorized: this bot is restricted to the owner.');
      return false;
    }

    return true;
  };

  bot.start(async (ctx) => {
    if (!(await guardOwner(ctx))) return;
    await ctx.reply('Chiki is online. Use /help to see available commands.');
  });

  bot.help(async (ctx) => {
    if (!(await guardOwner(ctx))) return;
    await ctx.reply('/start - Initialize\n/help - Show help\n/status - Service status');
  });

  bot.command('status', async (ctx) => {
    if (!(await guardOwner(ctx))) return;
    await ctx.reply('Status: healthy and ready.');
  });

  bot.on('text', async (ctx) => {
    if (!(await guardOwner(ctx))) return;

    const sent = await ctx.reply('Thinking...');

    try {
      let accumulated = '';
      for await (const part of chatService.streamReply(ctx.message.text)) {
        accumulated += part;
        await ctx.telegram.editMessageText(ctx.chat.id, sent.message_id, undefined, accumulated || '...');
      }
    } catch (error) {
      logger.error({ error }, 'telegram_message_pipeline_error');
      await ctx.reply('Sorry, I could not process your request safely right now.');
    }
  });

  bot.catch(async (error, ctx) => {
    logger.error({ error, updateType: ctx.updateType }, 'telegram_unhandled_error');
    await ctx.reply('An unexpected error occurred. Please try again.');
  });

  return bot;
}
