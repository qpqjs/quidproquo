import { describe, expect, it } from 'vitest';

import { askDateNow } from '../../actions/date/askDateNow';
import { DateActionType } from '../../actions/date/DateActionType';
import { ErrorActionType } from '../../actions/error/ErrorActionType';
import { askNewGuid } from '../../actions/guid/askNewGuid';
import { GuidActionType } from '../../actions/guid/GuidActionType';
import { askRandomNumber } from '../../actions/math/askRandomNumber';
import { MathActionType } from '../../actions/math/MathActionType';
import { SystemActionType } from '../../actions/system/SystemActionType';
import { Action, AskResponse, EitherActionResult } from '../../types';
import { askCatch } from './askCatch';
import { ActionOverrideHandler, ActionOverrideMap, askOverrideActions, getSuccessfulEitherActionResultIfRequired } from './askOverrideActions';
import { askRunParallel } from './askRunParallel';

// ─── Independent runtime harness ─────────────────────────────────────────────────
//
// askOverrideActions is the primitive that `runStory` is itself built on, so we do NOT
// test it with runStory — that would be circular. Instead this tiny independent driver
// stands in for the QPQ runtime: it answers each yielded action from a response map and
// records what reached it. Every test then reads as a story + overrides + responses,
// followed by assertions on the resolved value and on which actions hit the runtime.

interface ResponseError {
  readonly __responseError: true;
  readonly errorType: string;
  readonly errorText: string;
}

// Use as a response value to make the runtime fail that action.
const respondError = (errorType: string, errorText: string): ResponseError => ({ __responseError: true, errorType, errorText });

const isResponseError = (value: unknown): value is ResponseError =>
  typeof value === 'object' && value !== null && (value as ResponseError).__responseError === true;

type ResponseMap = Record<string, unknown>;

interface RuntimeOutcome {
  // The story's resolved value (undefined if an uncaught error escaped first).
  result: any;
  // Actions that reached the runtime, excluding the empty batch askCatch emits internally.
  runtimeActions: Action<any>[];
  // Set when an uncaught askThrowError escaped to the runtime.
  threwError?: { errorType: string; errorText: string };
}

// Shapes a single action's response, wrapping it as an EitherActionResult when the action
// opted into returnErrors. A failed response either becomes a caught error or throws.
const answerAction = (action: any, responses: ResponseMap): any => {
  if (action.type === SystemActionType.Batch) {
    return answerBatch(action, responses);
  }

  const raw = responses[action.type];

  if (isResponseError(raw)) {
    if (action.returnErrors) {
      return { success: false, error: { errorType: raw.errorType, errorText: raw.errorText } };
    }
    throw new Error(`Action ${action.type} errored without returnErrors protection`);
  }

  return action.returnErrors ? { success: true, result: raw } : raw;
};

// Resolves a batch the way the runtime would: each sub-action in order, short-circuiting on
// the first unprotected failure (which propagates as the whole batch failing).
const answerBatch = (batch: any, responses: ResponseMap): any => {
  const results: any[] = [];

  for (const sub of batch.payload.actions as any[]) {
    const raw = sub.type === SystemActionType.Batch ? answerBatch(sub, responses) : responses[sub.type];

    if (isResponseError(raw)) {
      if (sub.returnErrors) {
        results.push({ success: false, error: { errorType: raw.errorType, errorText: raw.errorText } });
        continue;
      }
      const error = { errorType: raw.errorType, errorText: raw.errorText };
      if (batch.returnErrors) {
        return { success: false, error };
      }
      throw new Error(`Batch failed without returnErrors: ${JSON.stringify(error)}`);
    }

    results.push(sub.returnErrors ? { success: true, result: raw } : raw);
  }

  return batch.returnErrors ? { success: true, result: results } : results;
};

// Drives an (already wrapped) story to completion against the response map.
const runWithRuntime = (story: AskResponse<any>, responses: ResponseMap = {}): RuntimeOutcome => {
  const runtimeActions: Action<any>[] = [];
  let next = story.next();

  while (!next.done) {
    const action = next.value as any;

    const isEmptyBatch = action.type === SystemActionType.Batch && action.payload?.actions?.length === 0;
    if (!isEmptyBatch) {
      runtimeActions.push(action);
    }

    if (action.type === ErrorActionType.ThrowError) {
      return { result: undefined, runtimeActions, threwError: action.payload };
    }

    next = story.next(answerAction(action, responses));
  }

  return { result: next.value, runtimeActions };
};

// ─── Override handler shorthands ─────────────────────────────────────────────────

// A handler that simply supplies a constant value — the common override case.
const returns = <T>(value: T): ActionOverrideHandler =>
  function* () {
    return value;
  };

// A handler that relays the action to the runtime and forwards the result verbatim.
const relay: ActionOverrideHandler = function* (action) {
  return yield action;
};

// ─── Fixtures ────────────────────────────────────────────────────────────────────

const MOCK_RANDOM = 0.88;
const MOCK_DATE = 1711234567890;
const MOCK_GUID = 'test-guid-abc-123';

const defaultResponses: ResponseMap = {
  [MathActionType.RandomNumber]: MOCK_RANDOM,
  [DateActionType.Now]: MOCK_DATE,
  [GuidActionType.New]: MOCK_GUID,
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('getSuccessfulEitherActionResultIfRequired', () => {
  it('wraps the value in an EitherActionResult when returnErrors is true', () => {
    expect(getSuccessfulEitherActionResultIfRequired(0.88, true)).toEqual({ success: true, result: 0.88 });
  });

  it('returns the raw value when returnErrors is false or undefined', () => {
    expect(getSuccessfulEitherActionResultIfRequired(0.88, false)).toBe(0.88);
    expect(getSuccessfulEitherActionResultIfRequired(0.88, undefined)).toBe(0.88);
  });

  it('wraps falsy values without losing them', () => {
    expect(getSuccessfulEitherActionResultIfRequired(null, true)).toEqual({ success: true, result: null });
    expect(getSuccessfulEitherActionResultIfRequired(undefined, true)).toEqual({ success: true, result: undefined });
  });
});

describe('askOverrideActions', () => {
  describe('simple non-batch scenarios', () => {
    it('returns the final value when the story yields no actions', () => {
      function* story(): AskResponse<number> {
        return 42;
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), {}));

      expect(result).toBe(42);
      expect(runtimeActions).toEqual([]);
    });

    it('passes a non-overridden action through to the runtime', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), {}), { [MathActionType.RandomNumber]: 0.42 });

      expect(result).toBe(0.42);
      expect(runtimeActions).toEqual([{ type: MathActionType.RandomNumber }]);
    });

    it('passes multiple non-overridden actions through in order', () => {
      function* story(): AskResponse<[number, string, string]> {
        const r = yield* askRandomNumber();
        const d = yield* askDateNow();
        const g = yield* askNewGuid();
        return [r, d, g];
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), {}), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM, MOCK_DATE, MOCK_GUID]);
      expect(runtimeActions).toEqual([{ type: MathActionType.RandomNumber }, { type: DateActionType.Now }, { type: GuidActionType.New }]);
    });

    it('intercepts an action with a matching type override, reaching no runtime', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }));

      expect(result).toBe(MOCK_RANDOM);
      expect(runtimeActions).toEqual([]);
    });

    it('intercepts an action with a wildcard override', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { '*': returns(0.99) }));

      expect(result).toBe(0.99);
    });

    it('prefers a specific type override over the wildcard', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(0.55), '*': returns(0.99) }));

      expect(result).toBe(0.55);
    });

    it('lets an override handler yield its own action to the runtime', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* () {
          const date: number = yield { type: DateActionType.Now };
          return date % 1000;
        },
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), { [DateActionType.Now]: MOCK_DATE });

      expect(result).toBe(MOCK_DATE % 1000);
      expect(runtimeActions).toEqual([{ type: DateActionType.Now }]);
    });

    it('lets an override handler yield several actions to the runtime', () => {
      function* story(): AskResponse<string> {
        return yield* askRandomNumber() as any;
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* () {
          const date: number = yield { type: DateActionType.Now };
          const guid: string = yield { type: GuidActionType.New };
          return `${date}-${guid}`;
        },
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toBe(`${MOCK_DATE}-${MOCK_GUID}`);
      expect(runtimeActions).toEqual([{ type: DateActionType.Now }, { type: GuidActionType.New }]);
    });

    it('feeds an override result back so the story continues with its later actions', () => {
      function* story(): AskResponse<{ random: number; date: string }> {
        const random = yield* askRandomNumber();
        const date = yield* askDateNow();
        return { random, date };
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), {
        [DateActionType.Now]: MOCK_DATE,
      });

      expect(result).toEqual({ random: MOCK_RANDOM, date: MOCK_DATE });
      expect(runtimeActions).toEqual([{ type: DateActionType.Now }]);
    });

    it('mixes overridden and non-overridden actions, yielding only the latter', () => {
      function* story(): AskResponse<[number, string, string]> {
        const r = yield* askRandomNumber();
        const d = yield* askDateNow();
        const g = yield* askNewGuid();
        return [r, d, g];
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: returns(MOCK_RANDOM),
        [GuidActionType.New]: returns(MOCK_GUID),
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), { [DateActionType.Now]: MOCK_DATE });

      expect(result).toEqual([MOCK_RANDOM, MOCK_DATE, MOCK_GUID]);
      expect(runtimeActions).toEqual([{ type: DateActionType.Now }]);
    });

    it('feeds an undefined override result back to the story', () => {
      function* story(): AskResponse<number | undefined> {
        return yield* askRandomNumber();
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(undefined) }));

      expect(result).toBeUndefined();
    });

    it('lets the story ignore the override result and return its own value', () => {
      function* story(): AskResponse<string> {
        yield* askRandomNumber();
        return 'my-own-value';
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }));

      expect(result).toBe('my-own-value');
    });
  });

  describe('returnErrors handling', () => {
    it('forwards a handler value that has shaped itself for returnErrors', () => {
      function* story(): AskResponse<EitherActionResult<number>> {
        return (yield { type: MathActionType.RandomNumber, returnErrors: true }) as EitherActionResult<number>;
      }

      const overrides: ActionOverrideMap = {
        // The engine forwards a handler's return verbatim, so a handler producing its own
        // value must wrap it for returnErrors itself.
        [MathActionType.RandomNumber]: function* (action) {
          return getSuccessfulEitherActionResultIfRequired(MOCK_RANDOM, action.returnErrors);
        },
      };

      const { result } = runWithRuntime(askOverrideActions(story(), overrides));

      expect(result).toEqual({ success: true, result: MOCK_RANDOM });
    });

    it('forwards a raw handler value when returnErrors is false', () => {
      function* story(): AskResponse<number> {
        return (yield { type: MathActionType.RandomNumber, returnErrors: false }) as number;
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }));

      expect(result).toBe(MOCK_RANDOM);
    });

    it('yields a non-overridden returnErrors action through unchanged', () => {
      function* story(): AskResponse<EitherActionResult<number>> {
        return (yield { type: MathActionType.RandomNumber, returnErrors: true }) as EitherActionResult<number>;
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), {}), { [MathActionType.RandomNumber]: MOCK_RANDOM });

      expect(result).toEqual({ success: true, result: MOCK_RANDOM });
      expect(runtimeActions).toEqual([{ type: MathActionType.RandomNumber, returnErrors: true }]);
    });
  });

  describe('batch scenarios', () => {
    it('passes a batch with no overrides through to the runtime', () => {
      function* story(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), {}), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM, MOCK_DATE]);
    });

    it('handles a fully overridden batch internally, reaching no runtime', () => {
      function* story(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: returns(MOCK_RANDOM),
        [DateActionType.Now]: returns(MOCK_DATE),
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM, MOCK_DATE]);
      expect(runtimeActions).toEqual([]);
    });

    it('keeps batch order when some actions are overridden and some pass through', () => {
      function* story(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM, MOCK_DATE]);
    });

    it('overrides only the middle action of a three-way batch', () => {
      function* story(): AskResponse<[number, string, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow(), askNewGuid()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [DateActionType.Now]: returns(MOCK_DATE) }), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM, MOCK_DATE, MOCK_GUID]);
    });

    it('throws an uncaught error when a batch action fails without returnErrors', () => {
      function* story(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }

      const { threwError } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), {
        ...defaultResponses,
        [DateActionType.Now]: respondError('GenericError', 'Date service down'),
      });

      expect(threwError).toEqual({ errorType: 'GenericError', errorText: 'Date service down' });
    });

    it('captures the failure of an overridden (relayed) batch action under askCatch', () => {
      function* story(): AskResponse<EitherActionResult<[number, string]>> {
        return yield* askCatch(askRunParallel([askRandomNumber(), askDateNow()]));
      }

      // The relayed RandomNumber fails at the runtime. Before the slot-level askCatch fix the
      // failure escaped the batch's returnErrors protection and killed the whole story.
      const { result, threwError } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: relay }), {
        ...defaultResponses,
        [MathActionType.RandomNumber]: respondError('GenericError', 'random service down'),
      });

      expect(threwError).toBeUndefined();
      expect(result).toEqual({ success: false, error: { errorType: 'GenericError', errorText: 'random service down' } });
    });

    it('passes a batch failure back to the story when wrapped in askCatch', () => {
      function* story(): AskResponse<EitherActionResult<[number, string]>> {
        return yield* askCatch(askRunParallel([askRandomNumber(), askDateNow()]));
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), {
        ...defaultResponses,
        [DateActionType.Now]: respondError('GenericError', 'Date service down'),
      });

      expect(result).toEqual({ success: false, error: { errorType: 'GenericError', errorText: 'Date service down' } });
    });
  });

  describe('askCatch composition', () => {
    it('returns a successful EitherActionResult from a fully overridden askCatch', () => {
      function* story(): AskResponse<EitherActionResult<number>> {
        return yield* askCatch(askRandomNumber());
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* (action) {
          return getSuccessfulEitherActionResultIfRequired(MOCK_RANDOM, action.returnErrors);
        },
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toEqual({ success: true, result: MOCK_RANDOM });
      expect(runtimeActions).toEqual([]);
    });

    it('passes an askCatch action through to the runtime when not overridden', () => {
      function* story(): AskResponse<EitherActionResult<number>> {
        return yield* askCatch(askRandomNumber());
      }

      const { result } = runWithRuntime(askOverrideActions(story(), {}), defaultResponses);

      expect(result).toEqual({ success: true, result: MOCK_RANDOM });
    });

    it('combines askCatch, a parallel batch and a partial override', () => {
      function* story(): AskResponse<EitherActionResult<[number, string]>> {
        return yield* askCatch(askRunParallel([askRandomNumber(), askDateNow()]));
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), defaultResponses);

      expect(result).toEqual({ success: true, result: [MOCK_RANDOM, MOCK_DATE] });
    });

    it('combines askCatch and a parallel batch with everything overridden', () => {
      function* story(): AskResponse<EitherActionResult<[number, string, string]>> {
        return yield* askCatch(askRunParallel([askRandomNumber(), askDateNow(), askNewGuid()]));
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: returns(MOCK_RANDOM),
        [DateActionType.Now]: returns(MOCK_DATE),
        [GuidActionType.New]: returns(MOCK_GUID),
      };

      const { result } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toEqual({ success: true, result: [MOCK_RANDOM, MOCK_DATE, MOCK_GUID] });
    });
  });

  describe('nested batch scenarios', () => {
    it('overrides an action inside a nested batch', () => {
      function* innerStory(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }
      function* story(): AskResponse<[[number, string], string]> {
        return yield* askRunParallel([innerStory(), askNewGuid()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), defaultResponses);

      expect(result).toEqual([[MOCK_RANDOM, MOCK_DATE], MOCK_GUID]);
    });

    it('overrides an action three batch-levels deep', () => {
      function* level1(): AskResponse<number> {
        return yield* askRandomNumber();
      }
      function* level2(): AskResponse<[number, string]> {
        return yield* askRunParallel([level1(), askDateNow()]);
      }
      function* story(): AskResponse<[[number, string], string]> {
        return yield* askRunParallel([level2(), askNewGuid()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), defaultResponses);

      expect(result).toEqual([[MOCK_RANDOM, MOCK_DATE], MOCK_GUID]);
    });

    it('resolves a nested batch with askCatch at every level', () => {
      function* innerStory(): AskResponse<EitherActionResult<[number, string]>> {
        return yield* askCatch(askRunParallel([askRandomNumber(), askDateNow()]));
      }
      function* story(): AskResponse<EitherActionResult<[EitherActionResult<[number, string]>, string]>> {
        return yield* askCatch(askRunParallel([innerStory(), askNewGuid()]));
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), defaultResponses);

      expect(result).toEqual({
        success: true,
        result: [{ success: true, result: [MOCK_RANDOM, MOCK_DATE] }, MOCK_GUID],
      });
    });
  });

  describe('wildcard behavior', () => {
    it('catches the individual actions inside a batch, not the batch itself', () => {
      function* story(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { '*': returns('wildcard-caught') }), defaultResponses);

      expect(result).toEqual(['wildcard-caught', 'wildcard-caught']);
    });

    it('catches actions inside nested batches', () => {
      function* innerStory(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }
      function* story(): AskResponse<[[number, string], string]> {
        return yield* askRunParallel([innerStory(), askNewGuid()]);
      }

      const overrides: ActionOverrideMap = {
        '*': function* (action: Action<any>) {
          return `wildcard-${action.type}`;
        },
      };

      const { result } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toEqual([[`wildcard-${MathActionType.RandomNumber}`, `wildcard-${DateActionType.Now}`], `wildcard-${GuidActionType.New}`]);
    });

    it('prefers a specific override over the wildcard inside a batch', () => {
      function* story(): AskResponse<[number, string, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow(), askNewGuid()]);
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: returns(MOCK_RANDOM),
        '*': returns('wildcard-fallback'),
      };

      const { result } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM, 'wildcard-fallback', 'wildcard-fallback']);
    });

    it('lets a wildcard handler yield its own action to the runtime', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const overrides: ActionOverrideMap = {
        '*': function* () {
          const date: number = yield { type: DateActionType.Now };
          return date + 1;
        },
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), { [DateActionType.Now]: MOCK_DATE });

      expect(result).toBe(MOCK_DATE + 1);
      expect(runtimeActions).toEqual([{ type: DateActionType.Now }]);
    });
  });

  describe('overriding batch actions directly', () => {
    it('respects a specific override for the Batch action', () => {
      function* story(): AskResponse<any> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }

      // askRunParallel feeds the batch override's array back to the sub-generators in order.
      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), { [SystemActionType.Batch]: returns(['batch-a', 'batch-b']) }));

      expect(result).toEqual(['batch-a', 'batch-b']);
      expect(runtimeActions).toEqual([]);
    });

    it('ignores a wildcard for the batch itself but honours a specific batch override', () => {
      function* story(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }

      const wildcard = runWithRuntime(askOverrideActions(story(), { '*': returns('wild') }), defaultResponses);
      expect(wildcard.result).toEqual(['wild', 'wild']);

      const batchOverride = runWithRuntime(askOverrideActions(story(), { [SystemActionType.Batch]: returns([111, 222]) }));
      expect(batchOverride.result).toEqual([111, 222]);
    });
  });

  describe('complex composition', () => {
    it('lets an override handler run its own parallel sub-stories', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* () {
          const [d1, d2] = yield* askRunParallel([askDateNow(), askDateNow()]);
          return d1 + d2;
        },
      };

      const { result } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toBe(MOCK_DATE + MOCK_DATE);
    });

    it('sends an override handler’s own yields to the runtime, not back through the overrides', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* () {
          // This DateNow yield goes to the runtime, bypassing the DateNow override below.
          const date: number = yield { type: DateActionType.Now };
          return date;
        },
        [DateActionType.Now]: returns(99999),
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), { [DateActionType.Now]: MOCK_DATE });

      expect(result).toBe(MOCK_DATE);
      expect(runtimeActions).toEqual([{ type: DateActionType.Now }]);
    });

    it('intercepts every directly-yielded action when each has an override', () => {
      function* story(): AskResponse<[number, string]> {
        const random = yield* askRandomNumber();
        const date = yield* askDateNow();
        return [random, date];
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: returns(MOCK_RANDOM),
        [DateActionType.Now]: returns(99999),
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides));

      expect(result).toEqual([MOCK_RANDOM, 99999]);
      expect(runtimeActions).toEqual([]);
    });

    it('threads sequential dependencies through mixed overrides', () => {
      function* story(): AskResponse<string> {
        const random = yield* askRandomNumber();
        const date = yield* askDateNow();
        const guid = yield* askNewGuid();
        return `${random}-${date}-${guid}`;
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: returns(MOCK_RANDOM),
        [GuidActionType.New]: returns('custom-guid'),
      };

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), overrides), { [DateActionType.Now]: MOCK_DATE });

      expect(result).toBe(`${MOCK_RANDOM}-${MOCK_DATE}-custom-guid`);
      expect(runtimeActions).toEqual([{ type: DateActionType.Now }]);
    });

    it('resolves a parallel + nested success case under an outer askCatch', () => {
      function* innerStory(): AskResponse<[number, string]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow()]);
      }
      function* story(): AskResponse<EitherActionResult<[[number, string], string]>> {
        return yield* askCatch(askRunParallel([innerStory(), askNewGuid()]));
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), defaultResponses);

      expect(result).toEqual({ success: true, result: [[MOCK_RANDOM, MOCK_DATE], MOCK_GUID] });
    });

    it('surfaces a nested-batch failure as either a thrown or caught error', () => {
      function* story(): AskResponse<EitherActionResult<[[number, string], string]>> {
        return yield* askCatch(
          askRunParallel([
            (function* (): AskResponse<[number, string]> {
              return yield* askRunParallel([askRandomNumber(), askDateNow()]);
            })(),
            askNewGuid(),
          ]),
        );
      }

      const { result, threwError } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), {
        ...defaultResponses,
        [DateActionType.Now]: respondError('GenericError', 'Date service down'),
      });

      // Depending on whether askCatch can catch the batch's askThrowError, the error surfaces
      // as a thrown error or as a failed result — either way it must carry the original text.
      if (threwError) {
        expect(threwError).toEqual({ errorType: 'GenericError', errorText: 'Date service down' });
      } else {
        expect(result.success).toBe(false);
        expect(result.error.errorText).toBe('Date service down');
      }
    });

    it('nests one askOverrideActions inside another, each owning its own override', () => {
      function* innerStory(): AskResponse<number> {
        return yield* askRandomNumber();
      }
      function* story(): AskResponse<[string, number]> {
        const date = yield* askDateNow();
        const random = yield* askOverrideActions(innerStory(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) });
        return [date, random];
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), { [DateActionType.Now]: returns(MOCK_DATE) }));

      expect(result).toEqual([MOCK_DATE, MOCK_RANDOM]);
      expect(runtimeActions).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('passes everything through with an empty override map', () => {
      function* story(): AskResponse<number> {
        return yield* askRandomNumber();
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), {}), { [MathActionType.RandomNumber]: MOCK_RANDOM });

      expect(result).toBe(MOCK_RANDOM);
      expect(runtimeActions).toEqual([{ type: MathActionType.RandomNumber }]);
    });

    it('returns immediately for a story that yields nothing', () => {
      function* story(): AskResponse<void> {
        return;
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), { '*': returns('never-called') }));

      expect(result).toBeUndefined();
      expect(runtimeActions).toEqual([]);
    });

    it('invokes the override afresh for each occurrence of the same action type', () => {
      function* story(): AskResponse<number[]> {
        const a = yield* askRandomNumber();
        const b = yield* askRandomNumber();
        const c = yield* askRandomNumber();
        return [a, b, c];
      }

      let callCount = 0;
      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* () {
          callCount += 1;
          return callCount * 10;
        },
      };

      const { result } = runWithRuntime(askOverrideActions(story(), overrides));

      expect(result).toEqual([10, 20, 30]);
      expect(callCount).toBe(3);
    });

    it('passes the full action object to the override handler', () => {
      function* story(): AskResponse<any> {
        return (yield { type: MathActionType.RandomNumber, payload: { seed: 42 } }) as any;
      }

      let receivedAction: Action<any> | null = null;
      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* (action) {
          receivedAction = action;
          return MOCK_RANDOM;
        },
      };

      runWithRuntime(askOverrideActions(story(), overrides));

      expect(receivedAction).toEqual({ type: MathActionType.RandomNumber, payload: { seed: 42 } });
    });

    it('supports an override handler that uses askCatch internally', () => {
      function* story(): AskResponse<any> {
        return yield* askRandomNumber();
      }

      const overrides: ActionOverrideMap = {
        [MathActionType.RandomNumber]: function* () {
          return yield* askCatch(askDateNow());
        },
      };

      const { result } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

      expect(result).toEqual({ success: true, result: MOCK_DATE });
    });

    it('handles a single-action batch (the askBatch optimization)', () => {
      function* story(): AskResponse<[number]> {
        return yield* askRunParallel([askRandomNumber()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), {}), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM]);
    });

    it('does not treat Object.prototype members as override handlers', () => {
      // An action type that collides with an inherited object member must pass through to the
      // runtime, not invoke Object.prototype.toString as a "handler".
      function* story(): AskResponse<string> {
        return (yield { type: 'toString' }) as string;
      }

      const { result, runtimeActions } = runWithRuntime(askOverrideActions(story(), {}), { toString: 'runtime-answer' });

      expect(result).toBe('runtime-answer');
      expect(runtimeActions).toEqual([{ type: 'toString' }]);
    });

    it('does not treat Object.prototype members as override handlers inside a batch', () => {
      function* subStory(): AskResponse<string> {
        return (yield { type: 'constructor' }) as string;
      }
      function* story(): AskResponse<[string, number]> {
        return yield* askRunParallel([subStory(), askRandomNumber()]);
      }

      const { result } = runWithRuntime(askOverrideActions(story(), {}), { constructor: 'runtime-answer', ...defaultResponses });

      expect(result).toEqual(['runtime-answer', MOCK_RANDOM]);
    });

    it('handles a large batch with partial overrides', () => {
      function* story(): AskResponse<number[]> {
        return yield* askRunParallel([askRandomNumber(), askDateNow(), askNewGuid(), askRandomNumber(), askDateNow()]) as any;
      }

      const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: returns(MOCK_RANDOM) }), defaultResponses);

      expect(result).toEqual([MOCK_RANDOM, MOCK_DATE, MOCK_GUID, MOCK_RANDOM, MOCK_DATE]);
    });
  });
});

// ─── Relay handlers (`return yield action`) ─────────────────────────────────────
//
// The engine forwards a handler's return value VERBATIM. A handler that relays an action
// with a bare `return yield action` therefore gets the parent's result delivered to the
// story unchanged — raw when the action has no returnErrors, or an EitherActionResult
// (success OR failure) when it does. Only handlers returning their OWN value must shape it.

describe('relay handlers (return yield action)', () => {
  it('relays a raw value from the runtime', () => {
    function* story(): AskResponse<number> {
      return yield* askRandomNumber();
    }

    const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: relay }), defaultResponses);

    expect(result).toBe(MOCK_RANDOM);
  });

  it('relays a success EitherActionResult under askCatch with a single wrap', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: relay }), defaultResponses);

    expect(result).toEqual({ success: true, result: MOCK_RANDOM });
  });

  it('relays a failure EitherActionResult under askCatch instead of masking it as success', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    const { result } = runWithRuntime(askOverrideActions(story(), { [MathActionType.RandomNumber]: relay }), {
      ...defaultResponses,
      [MathActionType.RandomNumber]: respondError('GenericError', 'boom'),
    });

    expect(result).toEqual({ success: false, error: { errorType: 'GenericError', errorText: 'boom' } });
  });

  it('requires a handler returning its OWN value to shape it for returnErrors', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    const overrides: ActionOverrideMap = {
      [MathActionType.RandomNumber]: function* (action) {
        return getSuccessfulEitherActionResultIfRequired(0.5, action.returnErrors);
      },
    };

    const { result } = runWithRuntime(askOverrideActions(story(), overrides), defaultResponses);

    expect(result).toEqual({ success: true, result: 0.5 });
  });
});
