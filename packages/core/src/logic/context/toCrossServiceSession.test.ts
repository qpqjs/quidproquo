import { describe, expect, it } from 'vitest';

import { StorySession } from '../../types';
import { createContextIdentifier } from './createContextIdentifier';
import { createLocalContextIdentifier } from './createLocalContextIdentifier';
import { toCrossServiceSession } from './toCrossServiceSession';

describe('toCrossServiceSession', () => {
  it('returns the same session when there is no local context or function globals', () => {
    const session: StorySession = { depth: 0, context: { a: 1 } };

    expect(toCrossServiceSession(session)).toBe(session);
  });

  it('strips local context while preserving the rest', () => {
    const session: StorySession = { depth: 2, context: { a: 1 }, localContext: { secret: 'x' } };

    const result = toCrossServiceSession(session);

    expect(result).toEqual({ depth: 2, context: { a: 1 } });
    expect('localContext' in result).toBe(false);
  });

  it('strips function globals while preserving the rest', () => {
    const session: StorySession = { depth: 2, context: { a: 1 }, functionGlobals: { routeGlobal: 'g' } };

    const result = toCrossServiceSession(session);

    expect(result).toEqual({ depth: 2, context: { a: 1 } });
    expect('functionGlobals' in result).toBe(false);
  });

  it('strips the raw access token while keeping the decoded one', () => {
    const decodedAccessToken = { userId: 'u1', username: 'u1', userDirectory: 'users', exp: 1, wasValid: true };
    const session: StorySession = { depth: 1, context: {}, accessToken: 'eyJraWQ.raw.bearer', decodedAccessToken };

    const result = toCrossServiceSession(session);

    expect(result).toEqual({ depth: 1, context: {}, decodedAccessToken });
    expect('accessToken' in result).toBe(false);
  });

  it('does not mutate the input session', () => {
    const session: StorySession = { depth: 1, context: {}, localContext: { secret: 'x' }, functionGlobals: { routeGlobal: 'g' } };

    toCrossServiceSession(session);

    expect(session.localContext).toEqual({ secret: 'x' });
    expect(session.functionGlobals).toEqual({ routeGlobal: 'g' });
  });

  // Security regression: a value provided under a local context identifier never crosses a service boundary, while a
  // value under an ordinary identifier does.
  it('drops values filed under local identifiers and keeps ordinary context', () => {
    const local = createLocalContextIdentifier<string>('db-password', '');
    const shared = createContextIdentifier<string>('tenant-id', '');
    const session = {
      depth: 0,
      context: { [shared.uniqueName]: 'tenant-a' },
      localContext: { [local.uniqueName]: 'hunter2' },
    } as StorySession;

    const crossed = toCrossServiceSession(session);

    expect(crossed.context).toEqual({ [shared.uniqueName]: 'tenant-a' });
    expect(crossed.localContext).toBeUndefined();
    expect(JSON.stringify(crossed)).not.toContain('hunter2');
  });
});
