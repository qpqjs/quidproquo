import { describe, expect, it } from 'vitest';

import { askContextRead } from '../../actions/context/askContextRead';
import { ContextActionType } from '../../actions/context/ContextActionType';
import { askDateNow } from '../../actions/date/askDateNow';
import { DateActionType } from '../../actions/date/DateActionType';
import { ErrorActionType } from '../../actions/error/ErrorActionType';
import { askRandomNumber } from '../../actions/math/askRandomNumber';
import { MathActionType } from '../../actions/math/MathActionType';
import { SystemActionType } from '../../actions/system/SystemActionType';
import { AskResponse, EitherActionResult, QpqContext, QpqContextIdentifier } from '../../types';
import { askCatch } from '../system/askCatch';
import { askRunParallel } from '../system/askRunParallel';
import { askContextProvideValue } from './askContextProvideValue';

// ─── Runtime simulator (mirrors askOverrideActions.test.ts) ────────────────────

interface SimulatorError {
  __simulateError: true;
  errorType: string;
  errorText: string;
}

function simulatorError(errorType: string, errorText: string): SimulatorError {
  return { __simulateError: true, errorType, errorText };
}

function isSimulatorError(val: any): val is SimulatorError {
  return val && val.__simulateError === true;
}

type ResponseMap = Record<string, any>;

function processActionResponse(action: any, responses: ResponseMap): any {
  if (action.type === SystemActionType.Batch) {
    return processBatchResponse(action, responses);
  }

  const raw = responses[action.type];

  if (isSimulatorError(raw)) {
    if (action.returnErrors) {
      return { success: false, error: { errorType: raw.errorType, errorText: raw.errorText } };
    }
    throw new Error(`Action ${action.type} errored without returnErrors protection`);
  }

  if (action.returnErrors) {
    return { success: true, result: raw };
  }
  return raw;
}

function processBatchResponse(batchAction: any, responses: ResponseMap): any {
  const subActions: any[] = batchAction.payload.actions;
  const subResults: any[] = [];
  let batchError: any = null;

  for (const sub of subActions) {
    const raw = sub.type === SystemActionType.Batch ? processBatchResponse(sub, responses) : responses[sub.type];

    if (isSimulatorError(raw)) {
      if (sub.returnErrors) {
        subResults.push({ success: false, error: { errorType: raw.errorType, errorText: raw.errorText } });
      } else {
        batchError = { errorType: raw.errorType, errorText: raw.errorText };
        break;
      }
    } else if (sub.returnErrors) {
      subResults.push({ success: true, result: raw });
    } else {
      subResults.push(raw);
    }
  }

  if (batchError) {
    if (batchAction.returnErrors) {
      return { success: false, error: batchError };
    }
    throw new Error(`Batch failed without returnErrors`);
  }

  if (batchAction.returnErrors) {
    return { success: true, result: subResults };
  }
  return subResults;
}

function simulateRuntime(gen: Generator<any, any, any>, responses: ResponseMap) {
  const yieldedActions: any[] = [];
  let next = gen.next();

  while (!next.done) {
    const action = next.value;
    yieldedActions.push(action);

    if (action.type === ErrorActionType.ThrowError) {
      return { result: undefined, yieldedActions, threwError: action.payload };
    }

    const response = processActionResponse(action, responses);
    next = gen.next(response);
  }

  return { result: next.value, yieldedActions };
}

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const ctxId = { uniqueName: 'demo-ctx' } as QpqContextIdentifier<string>;
const MOCK_RANDOM = 0.42;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('askContextProvideValue', () => {
  it('returns the provided value for a matching read', () => {
    function* story(): AskResponse<string> {
      return yield* askContextRead(ctxId);
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {});
    expect(result).toBe('CTX_VALUE');
  });

  it('does not double-wrap a matching read under askCatch', () => {
    function* story(): AskResponse<EitherActionResult<string>> {
      return yield* askCatch(askContextRead(ctxId));
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {});
    // Single wrap — was { success: true, result: { success: true, result: 'CTX_VALUE' } } before the fix.
    expect(result).toEqual({ success: true, result: 'CTX_VALUE' });
  });

  it('does not double-wrap a passthrough (wildcard) action under askCatch', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {
      [MathActionType.RandomNumber]: MOCK_RANDOM,
    });
    expect(result).toEqual({ success: true, result: MOCK_RANDOM });
  });

  it('propagates a passthrough error under askCatch instead of masking it as success', () => {
    function* story(): AskResponse<EitherActionResult<number>> {
      return yield* askCatch(askRandomNumber());
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {
      [MathActionType.RandomNumber]: simulatorError('GenericError', 'boom'),
    });
    expect(result.success).toBe(false);
    expect(result.error.errorText).toBe('boom');
  });

  it('injects the provided context onto passthrough actions', () => {
    function* story(): AskResponse<number> {
      return yield* askRandomNumber();
    }

    const { result, yieldedActions } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {
      [MathActionType.RandomNumber]: 7,
    });

    expect(result).toBe(7);
    const randomAction = yieldedActions.find((a) => a.type === MathActionType.RandomNumber);
    expect(randomAction.context).toEqual({ [ctxId.uniqueName]: 'CTX_VALUE' });
  });

  it('does not double-wrap batched passthrough actions under askCatch', () => {
    function* story(): AskResponse<EitherActionResult<[number, string]>> {
      return yield* askCatch(askRunParallel([askRandomNumber(), askDateNow()]));
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {
      [MathActionType.RandomNumber]: 1,
      [DateActionType.Now]: 'two',
    });
    expect(result).toEqual({ success: true, result: [1, 'two'] });
  });

  it('does not double-wrap a list under askCatch', () => {
    function* story(): AskResponse<EitherActionResult<QpqContext<any>>> {
      return yield* askCatch(
        (function* (): AskResponse<QpqContext<any>> {
          return (yield { type: ContextActionType.List }) as QpqContext<any>;
        })(),
      );
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {
      [ContextActionType.List]: { existing: 'base' },
    });
    expect(result).toEqual({ success: true, result: { existing: 'base', [ctxId.uniqueName]: 'CTX_VALUE' } });
  });

  it('propagates a failed parent list as a thrown error instead of masking it', () => {
    function* story(): AskResponse<QpqContext<any>> {
      return (yield { type: ContextActionType.List }) as QpqContext<any>;
    }

    const { threwError } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {
      [ContextActionType.List]: simulatorError('GenericError', 'context service down'),
    });

    expect(threwError).toEqual({ errorType: 'GenericError', errorText: 'context service down', errorStack: undefined });
  });

  it('propagates a failed parent list to a surrounding askCatch', () => {
    function* story(): AskResponse<EitherActionResult<QpqContext<any>>> {
      return yield* askCatch(
        (function* (): AskResponse<QpqContext<any>> {
          return (yield { type: ContextActionType.List }) as QpqContext<any>;
        })(),
      );
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxId, 'CTX_VALUE', story()), {
      [ContextActionType.List]: simulatorError('GenericError', 'context service down'),
    });

    expect(result.success).toBe(false);
    expect(result.error.errorText).toBe('context service down');
  });

  it('resolves reads across nested providers', () => {
    const ctxA = { uniqueName: 'ctx-a' } as QpqContextIdentifier<string>;
    const ctxB = { uniqueName: 'ctx-b' } as QpqContextIdentifier<string>;

    function* story(): AskResponse<[string, string]> {
      const a = yield* askContextRead(ctxA);
      const b = yield* askContextRead(ctxB);
      return [a, b];
    }

    const { result } = simulateRuntime(askContextProvideValue(ctxA, 'AAA', askContextProvideValue(ctxB, 'BBB', story())), {});
    expect(result).toEqual(['AAA', 'BBB']);
  });
});
