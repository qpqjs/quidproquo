import { describe, expect, it } from 'vitest';

import { askContextRead } from '../../actions';
import { runStory } from '../../testing';
import { AskResponse } from '../../types';
import { createContextIdentifier } from './createContextIdentifier';
import { createContextProvider } from './createContextProvider';

describe('createContextProvider', () => {
  const greetingContext = createContextIdentifier('greeting', 'hi');

  it('provides the mapped value to a wrapped story that reads it', () => {
    const provideGreeting = createContextProvider(greetingContext, (name: string) => `hello-${name}`);

    function* readsContext(): AskResponse<string> {
      return yield* askContextRead(greetingContext);
    }

    expect(runStory(provideGreeting('world', readsContext()))).toBe('hello-world');
  });

  it('passes all leading args to the value mapper', () => {
    const provide = createContextProvider(greetingContext, (a: string, b: number) => `${a}:${b}`);

    function* readsContext(): AskResponse<string> {
      return yield* askContextRead(greetingContext);
    }

    expect(runStory(provide('x', 7, readsContext()))).toBe('x:7');
  });

  it('returns the inner story result', () => {
    const provide = createContextProvider(greetingContext, () => 'provided');

    function* innerStory(): AskResponse<number> {
      yield* askContextRead(greetingContext);
      return 99;
    }

    expect(runStory(provide(innerStory()))).toBe(99);
  });
});
