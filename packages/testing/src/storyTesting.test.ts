import { askConfigGetParameter } from '@qpqjs/core';
import { ConfigActionType } from '@qpqjs/core';
import { askDateNow } from '@qpqjs/core';
import { DateActionType } from '@qpqjs/core';
import { askNewGuid } from '@qpqjs/core';
import { GuidActionType } from '@qpqjs/core';
import { askRandomNumber } from '@qpqjs/core';
import { MathActionType } from '@qpqjs/core';
import { askCatch } from '@qpqjs/core';
import { askRunParallel } from '@qpqjs/core';
import { ActionOf } from '@qpqjs/core';
import { AskResponse, EitherActionResult } from '@qpqjs/core';

import { describe, expect, it, vi } from 'vitest';

import { runStory, StoryError, throwsError } from './storyTesting';

describe('runStory', () => {
  it('mocks a single action with a literal value', () => {
    function* story(): AskResponse<number> {
      return yield* askRandomNumber();
    }

    expect(runStory(story(), { [MathActionType.RandomNumber]: 0.42 })).toBe(0.42);
  });

  it('mocks each action in a sequence and threads results through the story', () => {
    function* story(): AskResponse<string> {
      const random = yield* askRandomNumber();
      const guid = yield* askNewGuid();
      return `${random}-${guid}`;
    }

    const result = runStory(story(), {
      [MathActionType.RandomNumber]: 0.5,
      [GuidActionType.New]: 'abc',
    });

    expect(result).toBe('0.5-abc');
  });

  it('re-invokes a function mock on each matching action, so it can be stateful', () => {
    function* story(): AskResponse<number> {
      const a = yield* askRandomNumber();
      const b = yield* askRandomNumber();
      return a + b;
    }

    let call = 0;
    expect(runStory(story(), { [MathActionType.RandomNumber]: () => (call += 10) })).toBe(30);
  });

  it('passes the yielded action to a function mock so it can vary by payload', () => {
    function* story(): AskResponse<string> {
      return yield* askConfigGetParameter('db/host');
    }

    const result = runStory(story(), {
      [ConfigActionType.GetParameter]: (action: ActionOf<typeof askConfigGetParameter>) => `value-for-${action.payload.parameterName}`,
    });

    expect(result).toBe('value-for-db/host');
  });

  it('answers actions run in parallel (batches) by type', () => {
    function* story(): AskResponse<[number, string]> {
      return yield* askRunParallel([askRandomNumber(), askDateNow()]);
    }

    expect(
      runStory(story(), {
        [MathActionType.RandomNumber]: 0.1,
        [DateActionType.Now]: 'today',
      }),
    ).toEqual([0.1, 'today']);
  });

  it('wraps mocked values for askCatch automatically', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    expect(runStory(story(), { [MathActionType.RandomNumber]: 0.9 })).toEqual({ success: true, result: 0.9 });
  });

  it('surfaces an uncaught throwsError as a thrown StoryError', () => {
    function* story(): AskResponse<number> {
      return yield* askRandomNumber();
    }

    expect(() => runStory(story(), { [MathActionType.RandomNumber]: throwsError('Boom', 'kaboom') })).toThrow(StoryError);
  });

  it('surfaces a caught throwsError as a failed result under askCatch', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: throwsError('Boom', 'kaboom') });

    expect(result).toEqual({ success: false, error: { errorType: 'Boom', errorText: 'kaboom', errorStack: undefined } });
  });

  it('a wildcard mock answers any action', () => {
    function* story(): AskResponse<[number, number]> {
      const a = yield* askRandomNumber();
      const b = yield* askRandomNumber();
      return [a, b];
    }

    expect(runStory(story(), { '*': 7 })).toEqual([7, 7]);
  });

  it('throws a helpful error when an action is left unmocked', () => {
    function* story(): AskResponse<string> {
      return yield* askDateNow();
    }

    expect(() => runStory(story())).toThrow(/Unmocked action.*Date\/Now/);
  });

  it('mocks double as spies via vi.fn', () => {
    function* story(): AskResponse<void> {
      yield* askNewGuid();
    }

    const guid = vi.fn(() => 'spy-guid');
    runStory(story(), { [GuidActionType.New]: guid });

    expect(guid).toHaveBeenCalledWith({ type: GuidActionType.New });
  });
});
