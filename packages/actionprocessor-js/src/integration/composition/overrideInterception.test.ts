import { describe, expect, it } from 'vitest';

import { runComposition } from './runtime';
import { assignIds, buildStory, evaluate, generateOverride, show, Spec } from './spec';

// Override-interception matrix: every composition of askOverrideActions (by leaf type or
// wildcard) over ok/fail leaves, wrapped in askCatch / askRunParallel, run through the REAL
// runtime, asserted against the contract oracle.
//
// The contract: an override intercepts every matching action in its child subtree (the
// nearest override wins, including inside parallel batches); overriding a failing action's
// type suppresses the failure and substitutes the override value.

const specs = generateOverride(2);

describe(`override interception through the real runtime (${specs.length} compositions, depth<=2)`, () => {
  it.each(specs.map((spec) => [show(spec), spec] as const))('%s', async (_label: string, spec: Spec) => {
    const idSpec = assignIds(spec);
    const expected = evaluate(idSpec);

    const storyResult = await runComposition(() => buildStory(idSpec));

    if (expected.ok) {
      expect(storyResult.error).toBeUndefined();
      expect(storyResult.result).toEqual(expected.value);
    } else {
      expect(storyResult.error?.errorType).toBe(expected.error);
    }
  });
});
