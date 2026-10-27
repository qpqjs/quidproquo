import { describe, expect, it } from 'vitest';

import { runComposition } from './runtime';
import { assignIds, buildStory, evaluate, generateLocalContext, show, Spec } from './spec';

// Local-context matrix: global and local provide/read, with service boundaries, nested under
// catch / parallel, run through the REAL runtime, asserted against the contract oracle.
//
// The contract: local context (createLocalContextIdentifier) flows down the story tree and
// through in-process batches exactly like global context, but is STRIPPED when a story crosses
// a service boundary (toCrossServiceSession), while global context survives the crossing.

const specs = generateLocalContext(2);

describe(`local context + service boundaries through the real runtime (${specs.length} compositions, depth<=2)`, () => {
  it.each(specs.map((spec) => [show(spec), spec] as const))('%s', async (_label: string, spec: Spec) => {
    const idSpec = assignIds(spec);
    const expected = evaluate(idSpec);

    const storyResult = await runComposition(() => buildStory(idSpec));

    expect(storyResult.error).toBeUndefined();
    expect(storyResult.result).toEqual((expected as { ok: true; value: any }).value);
  });
});
