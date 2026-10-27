import { describe, expect, it } from 'vitest';

import { runComposition } from './runtime';
import { assignIds, buildStory, evaluate, generateError, show, Spec } from './spec';

// Error-reachability matrix: every composition of askCatch + askRunParallel + ok/fail leaves
// up to depth 2, run through the REAL runtime, asserted against the contract oracle.
//
// The contract: a failure is caught by the nearest enclosing askCatch (producing an error
// envelope); with no enclosing catch it escapes to the top as storyResult.error. A failing
// branch fails its parallel batch.

const specs = generateError(2);

describe(`error reachability through the real runtime (${specs.length} compositions, depth<=2)`, () => {
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
