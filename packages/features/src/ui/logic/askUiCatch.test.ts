import { AskResponse, askThrowError, ErrorTypeEnum, Nullable } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUiCatch } from './askUiCatch';

const buildUi = () => {
  const calls: string[] = [];

  return {
    calls,
    *askSetError(error: Nullable<string>): AskResponse<void> {
      calls.push(`error:${error}`);
    },
    *askSetBusy(busy: boolean): AskResponse<void> {
      calls.push(`busy:${busy}`);
    },
  };
};

function* askWork(): AskResponse<number> {
  return 42;
}

function* askFailingWork(): AskResponse<number> {
  return yield* askThrowError(ErrorTypeEnum.Forbidden, 'nope');
}

describe('askUiCatch', () => {
  it('raises busy, clears the error, runs the work and lowers busy', () => {
    const ui = buildUi();

    const result = runStory(askUiCatch(askWork(), ui));

    expect(result).toEqual({ success: true, result: 42 });
    expect(ui.calls).toEqual(['busy:true', 'error:null', 'busy:false']);
  });

  it("records the error's own text after lowering busy when the work fails", () => {
    const ui = buildUi();

    const result = runStory(askUiCatch(askFailingWork(), ui));

    expect(result.success).toBe(false);
    expect(ui.calls).toEqual(['busy:true', 'error:null', 'busy:false', 'error:nope']);
  });

  it('uses a fixed or derived error text when given one', () => {
    const fixed = buildUi();
    runStory(askUiCatch(askFailingWork(), { ...fixed, errorText: 'Load failed.' }));
    expect(fixed.calls.at(-1)).toBe('error:Load failed.');

    const derived = buildUi();
    runStory(askUiCatch(askFailingWork(), { ...derived, errorText: (error) => `[${error.errorType}] ${error.errorText}` }));
    expect(derived.calls.at(-1)).toBe(`error:[${ErrorTypeEnum.Forbidden}] nope`);
  });

  it('works without a busy flag', () => {
    const ui = buildUi();

    runStory(askUiCatch(askWork(), { askSetError: ui.askSetError }));

    expect(ui.calls).toEqual(['error:null']);
  });
});
