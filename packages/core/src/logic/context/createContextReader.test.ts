import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ContextActionType } from '../../actions/context';
import { askContextReadBase } from '../../actions/context/askContextRead';
import { ActionOf } from '../../types';
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
      [ContextActionType.Read]: (action: ActionOf<typeof askContextReadBase>) => action.payload.contextIdentifier.uniqueName,
    });

    expect(result).toBe('user');
  });
});
