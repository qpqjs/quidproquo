import { describe, expect, it } from 'vitest';

import { ContextActionType } from '../../actions/context';
import { ContextReadAction } from '../../actions/context/askContextRead';
import { runStory } from '../../testing';
import { createContextIdentifier } from './createContextIdentifier';
import { createContextReader } from './createContextReader';

describe('createContextReader', () => {
  const userContext = createContextIdentifier('user', 'anonymous');

  it('yields a context read and returns its value', () => {
    const readUser = createContextReader(userContext);

    const result = runStory(readUser(), {
      [ContextActionType.Read]: 'alice',
    });

    expect(result).toBe('alice');
  });

  it('reads against the provided identifier', () => {
    const readUser = createContextReader(userContext);

    const result = runStory(readUser(), {
      [ContextActionType.Read]: (action: ContextReadAction<string>) => action.payload.contextIdentifier.uniqueName,
    });

    expect(result).toBe('user');
  });
});
