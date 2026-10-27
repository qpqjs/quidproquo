import { describe, expect, it } from 'vitest';

import { createContextIdentifier } from '../../logic/context/createContextIdentifier';
import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { askContextRead } from './askContextRead';
import { ContextActionType } from './ContextActionType';

describe('askContextRead', () => {
  it('yields a Read action with the supplied context identifier', () => {
    const contextIdentifier = { key: 'my-context' } as any;

    const { action } = captureRequester(askContextRead(contextIdentifier));

    expect(action).toEqual({
      type: ContextActionType.Read,
      payload: { contextIdentifier },
    });
  });

  it('returns the context value the runtime resolves', () => {
    const value = { userId: 'u1' };
    const { returned } = captureRequester(askContextRead({ key: 'my-context' } as any), value);

    expect(returned).toBe(value);
  });

  it('resolves to the identifier default when no provider has set a value', () => {
    const identifier = createContextIdentifier<string>('unit-test-context', 'the-default');

    const result = runStory(askContextRead(identifier));

    expect(result).toBe('the-default');
  });

  it('propagates a processor failure as a thrown StoryError', () => {
    const identifier = createContextIdentifier<string>('unit-test-context', 'the-default');

    const runFailingStory = () =>
      runStory(askContextRead(identifier), {
        [ContextActionType.Read]: throwsError(ErrorTypeEnum.GenericError, 'Context read failed'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${ErrorTypeEnum.GenericError}: Context read failed`);
  });
});
