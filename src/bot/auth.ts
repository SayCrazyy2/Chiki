import type { Context } from 'telegraf';
import type { Logger } from 'pino';

export function isOwnerContext(ctx: Context, ownerId: number): boolean {
  return ctx.from?.id === ownerId;
}

export async function requireOwner(ctx: Context, ownerId: number, logger: Logger): Promise<boolean> {
  if (isOwnerContext(ctx, ownerId)) {
    return true;
  }

  logger.warn({ userId: ctx.from?.id, updateType: ctx.updateType }, 'telegram_unauthorized_access');
  await ctx.reply('Unauthorized: this bot is restricted to the owner.');
  return false;
}
