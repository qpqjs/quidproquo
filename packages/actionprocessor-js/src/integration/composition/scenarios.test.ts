import {
  askCatch,
  askContextProvideValue,
  askContextRead,
  askOverrideActions,
  askRunParallel,
  createContextIdentifier,
  getSuccessfulEitherActionResultIfRequired,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { echo, FAIL_ACTION, failLeaf, runComposition } from './runtime';

// Curated, readable companions to the exhaustive matrices: a handful of named compositions
// run through the REAL runtime, documenting the headline behaviours in plain sight.

const userId = createContextIdentifier<string>('userId', 'anonymous');

describe('composition scenarios (real runtime)', () => {
  it('catches a parallel-batch failure at an enclosing askCatch', async () => {
    const story = function* () {
      return yield* askCatch(askRunParallel([echo('a'), failLeaf('boom')]));
    };

    const { result, error } = await runComposition(() => story());

    expect(error).toBeUndefined();
    expect(result).toEqual({ success: false, error: { errorType: 'boom', errorText: 'boom' } });
  });

  it('lets a failure in a parallel batch escape to the top when nothing catches it', async () => {
    const story = function* () {
      return yield* askRunParallel([echo('a'), failLeaf('boom')]);
    };

    const { error } = await runComposition(() => story());

    expect(error?.errorType).toBe('boom');
  });

  it('isolates a failure when each branch catches its own', async () => {
    const story = function* () {
      return yield* askRunParallel([
        (function* () {
          return yield* askCatch(echo('a'));
        })(),
        (function* () {
          return yield* askCatch(failLeaf('boom'));
        })(),
      ]);
    };

    const { result } = await runComposition(() => story());

    expect(result).toEqual([
      { success: true, result: 'a' },
      { success: false, error: { errorType: 'boom', errorText: 'boom' } },
    ]);
  });

  it('reads a context value provided above a parallel from inside both branches', async () => {
    const story = function* () {
      return yield* askContextProvideValue(userId, 'u-1', askRunParallel([askContextRead(userId), askContextRead(userId)]));
    };

    const { result } = await runComposition(() => story());

    expect(result).toEqual(['u-1', 'u-1']);
  });

  it('resolves a read to the nearest provider, shadowing an outer one', async () => {
    const story = function* () {
      return yield* askContextProvideValue(userId, 'outer', askContextProvideValue(userId, 'inner', askContextRead(userId)));
    };

    expect((await runComposition(() => story())).result).toBe('inner');
  });

  it('combines provide + override + parallel + catch in one tree', async () => {
    // provide(userId='u-1') -> override(failing actions -> 'recovered') -> catch( parallel( read, fail ) )
    const recoverFailures = {
      [FAIL_ACTION]: function* (action: any) {
        return getSuccessfulEitherActionResultIfRequired('recovered', action.returnErrors);
      },
    };

    const story = function* () {
      return yield* askContextProvideValue(
        userId,
        'u-1',
        askOverrideActions(
          (function* () {
            return yield* askCatch(askRunParallel([askContextRead(userId), failLeaf('boom')]));
          })(),
          recoverFailures,
        ),
      );
    };

    const { result, error } = await runComposition(() => story());

    // The failing branch is intercepted by the override (so the batch never fails), the read
    // resolves to the provided value, and the catch wraps the successful array.
    expect(error).toBeUndefined();
    expect(result).toEqual({ success: true, result: ['u-1', 'recovered'] });
  });
});
