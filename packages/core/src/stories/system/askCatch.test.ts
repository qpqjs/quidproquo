import { expectError, runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askGuidNew } from '../../actions/guid/askGuidNew';
import { GuidActionType } from '../../actions/guid/GuidActionType';
import { askMathRandomNumber } from '../../actions/math/askMathRandomNumber';
import { MathActionType } from '../../actions/math/MathActionType';
import { AskResponse, EitherActionResult, ErrorTypeEnum } from '../../types';
import { askCatch } from './askCatch';

describe('askCatch', () => {
  it('wraps a story that completes in a successful result', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askMathRandomNumber());
    }

    expect(runStory(story(), { [MathActionType.RandomNumber]: 0.5 })).toEqual({ success: true, result: 0.5 });
  });

  it('captures a failed action as a failed result', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askMathRandomNumber());
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: throwsError('Boom', 'kaboom') });

    expect(result).toEqual({ success: false, error: { errorType: 'Boom', errorText: 'kaboom', errorStack: undefined } });
  });

  it('runs the finally story after a success', () => {
    let ran = false;
    function* cleanup(): AskResponse<void> {
      yield* askGuidNew();
      ran = true;
    }
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askMathRandomNumber(), cleanup());
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: 1, [GuidActionType.New]: 'g' });

    expect(result).toEqual({ success: true, result: 1 });
    expect(ran).toBe(true);
  });

  it('runs the finally story even when the body fails', () => {
    let ran = false;
    function* cleanup(): AskResponse<void> {
      yield* askGuidNew();
      ran = true;
    }
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askMathRandomNumber(), cleanup());
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: throwsError('Boom', 'kaboom'), [GuidActionType.New]: 'g' });

    expect(result.success).toBe(false);
    expect(ran).toBe(true);
  });

  it('converts a thrown exception in the body into a failed result', () => {
    function* throwing(): AskResponse<number> {
      throw new Error('boom: /srv/internal/path');
    }
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(throwing());
    }

    const result = runStory(story());

    expect(result.success).toBe(false);
    const error = expectError(result);
    expect(error).toMatchObject({ errorType: ErrorTypeEnum.GenericError, errorText: 'An unexpected error occurred [Error].' });
    expect(error.errorStack).toContain('boom: /srv/internal/path');
  });

  it('passes the either result down to a nested askCatch', () => {
    function* story(): AskResponse<EitherActionResult<EitherActionResult<number>>> {
      return yield* askCatch(askCatch(askMathRandomNumber()));
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: throwsError('Boom', 'kaboom') });

    expect(result).toEqual({
      success: true,
      result: { success: false, error: { errorType: 'Boom', errorText: 'kaboom', errorStack: undefined } },
    });
  });
});
