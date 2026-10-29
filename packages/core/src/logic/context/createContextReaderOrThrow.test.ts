import { runStory, StoryError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ContextActionType } from '../../actions/context';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { createContextIdentifier } from './createContextIdentifier';
import { createContextReaderOrThrow } from './createContextReaderOrThrow';

describe('createContextReaderOrThrow', () => {
  const scopeContext = createContextIdentifier<string | undefined>('qpq-scope', undefined);
  const readScopeOrThrow = createContextReaderOrThrow(scopeContext, ErrorTypeEnum.Forbidden, 'No scope was provided.');

  it('returns the provided value', () => {
    const result = runStory(readScopeOrThrow(), {
      [ContextActionType.Read]: 'TENANT#1',
    });

    expect(result).toBe('TENANT#1');
  });

  it.each([undefined, null])('throws the given error when the read yields %s', (value) => {
    let thrown: unknown;
    try {
      runStory(readScopeOrThrow(), { [ContextActionType.Read]: value });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(StoryError);
    expect((thrown as StoryError).errorType).toBe(ErrorTypeEnum.Forbidden);
    expect((thrown as StoryError).errorText).toBe('No scope was provided.');
  });

  it('treats an empty string as provided', () => {
    expect(runStory(readScopeOrThrow(), { [ContextActionType.Read]: '' })).toBe('');
  });
});
