import { describe, expect, it } from 'vitest';

import { StorySession } from '../../types';
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

  it('does not mutate the input session', () => {
    const session: StorySession = { depth: 1, context: {}, localContext: { secret: 'x' }, functionGlobals: { routeGlobal: 'g' } };

    toCrossServiceSession(session);

    expect(session.localContext).toEqual({ secret: 'x' });
    expect(session.functionGlobals).toEqual({ routeGlobal: 'g' });
  });
});
