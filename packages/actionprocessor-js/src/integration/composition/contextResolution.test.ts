import { describe, expect, it } from 'vitest';

import { runComposition } from './runtime';
import { assignIds, buildStory, evaluate, generateContext, show, Spec } from './spec';

// Context-resolution matrix: every composition of askContextProvideValue + askContextRead,
// wrapped in askCatch / askRunParallel, run through the REAL runtime, asserted against the
// contract oracle.
//
// The contract: a read resolves to the value from the nearest enclosing provider of that key
// (so a nested provide shadows an outer one, and a different key falls through), or the
// identifier's default when no provider encloses it, even across parallel batches and catches.

const specs = generateContext(2);

describe(`context resolution through the real runtime (${specs.length} compositions, depth<=2)`, () => {
  it.each(specs.map((spec) => [show(spec), spec] as const))('%s', async (_label: string, spec: Spec) => {
    const idSpec = assignIds(spec);
    const expected = evaluate(idSpec);

    const storyResult = await runComposition(() => buildStory(idSpec));

    expect(storyResult.error).toBeUndefined();
    expect(storyResult.result).toEqual((expected as { ok: true; value: any }).value);
  });
});
