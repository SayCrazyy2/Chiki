import { describe, expect, it } from 'vitest';

import { isOwnerContext } from '../src/bot/auth.js';

describe('owner auth guard', () => {
  it('accepts owner user id', () => {
    const ok = isOwnerContext({ from: { id: 42 } } as never, 42);
    expect(ok).toBe(true);
  });

  it('rejects non-owner user id', () => {
    const ok = isOwnerContext({ from: { id: 7 } } as never, 42);
    expect(ok).toBe(false);
  });
});
