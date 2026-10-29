import { expectError, runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askNewGuid } from '../../actions/guid/askNewGuid';
import { GuidActionType } from '../../actions/guid/GuidActionType';
import { askRandomNumber } from '../../actions/math/askRandomNumber';
import { MathActionType } from '../../actions/math/MathActionType';
import { AskResponse, EitherActionResult, ErrorTypeEnum } from '../../types';
import { askCatch } from './askCatch';

describe('askCatch', () => {
  it('wraps a story that completes in a successful result', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    expect(runStory(story(), { [MathActionType.RandomNumber]: 0.5 })).toEqual({ success: true, result: 0.5 });
  });

  it('captures a failed action as a failed result', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: throwsError('Boom', 'kaboom') });

    expect(result).toEqual({ success: false, error: { errorType: 'Boom', errorText: 'kaboom', errorStack: undefined } });
  });

  it('runs the finally story after a success', () => {
    let ran = false;
    function* cleanup(): AskResponse<void> {
      yield* askNewGuid();
      ran = true;
    }
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber(), cleanup());
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: 1, [GuidActionType.New]: 'g' });

    expect(result).toEqual({ success: true, result: 1 });
    expect(ran).toBe(true);
  });

  it('runs the finally story even when the body fails', () => {
    let ran = false;
    function* cleanup(): AskResponse<void> {
      yield* askNewGuid();
      ran = true;
    }
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber(), cleanup());
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
      return yield* askCatch(askCatch(askRandomNumber()));
    }

    const result = runStory(story(), { [MathActionType.RandomNumber]: throwsError('Boom', 'kaboom') });

    expect(result).toEqual({
      success: true,
      result: { success: false, error: { errorType: 'Boom', errorText: 'kaboom', errorStack: undefined } },
    });
  });
});
