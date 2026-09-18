import { describe, expect, it } from 'vitest';

import { Brand } from '../types/Brand';
import { createBrandGuard } from './createBrandGuard';

type UserId = Brand<string, 'UserId'>;
type Port = Brand<number, 'Port'>;

const isUserId = createBrandGuard<string, UserId>((value) => /^user_[a-z0-9]+$/.test(value));
const isPort = createBrandGuard<number, Port>((value) => Number.isInteger(value) && value > 0 && value < 65536);

describe('createBrandGuard', () => {
  it('accepts values the predicate approves', () => {
    expect(isUserId('user_abc123')).toBe(true);
    expect(isPort(8080)).toBe(true);
  });

  it('rejects values the predicate refuses', () => {
    expect(isUserId('abc123')).toBe(false);
    expect(isPort(70000)).toBe(false);
    expect(isPort(1.5)).toBe(false);
  });

  it('narrows to the branded type', () => {
    const takeUserId = (id: UserId): string => id;
    const raw: string = 'user_abc123';

    if (isUserId(raw)) {
      expect(takeUserId(raw)).toBe('user_abc123');
    }

    // @ts-expect-error a plain string is not a UserId
    takeUserId(raw);
  });
});
