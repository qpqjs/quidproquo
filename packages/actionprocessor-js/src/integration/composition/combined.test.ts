import { describe, expect, it } from 'vitest';

import { runComposition } from './runtime';
import { assignIds, buildStory, evaluate, generateCombined, show, Spec } from './spec';

// Combined matrix: ok/fail/read leaves freely nested under provide + override + catch +
// parallel, run through the REAL runtime, asserted against the contract oracle. This is the
// cross-interaction surface (a context provide wrapping an override wrapping a parallel with
// a catch at any level) where a flag dropped at one seam would show up as a mismatch.

const specs = generateCombined(2);

describe(`combined primitives through the real runtime (${specs.length} compositions, depth<=2)`, () => {
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
