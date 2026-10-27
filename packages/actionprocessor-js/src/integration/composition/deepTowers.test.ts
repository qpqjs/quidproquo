import { describe, expect, it } from 'vitest';

import { runComposition } from './runtime';
import { assignIds, buildStory, evaluate, generateTowers, Spec } from './spec';

// Mega-tower stress test: every control-flow primitive (catch, override, global/local provide,
// boundary, parallel) stacked many levels deep down a single chain, in every rotation order,
// over each leaf kind, run through the REAL runtime and asserted against the contract oracle.
// This is where a flag dropped at a seam, or context/overrides leaking across a boundary in a
// tall stack, would accumulate and show up.

const DEPTH = 84;
const towers = generateTowers(DEPTH);

// Titles are huge at this depth, so index them instead of printing the whole chain.
describe(`deep towers through the real runtime (${towers.length} towers, depth ${DEPTH})`, () => {
  it.each(towers.map((spec, index) => [index, spec] as const))('tower #%i', async (_index: number, spec: Spec) => {
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
