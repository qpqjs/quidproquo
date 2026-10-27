import { askContextProvideValue, askContextRead, createContextIdentifier, createLocalContextIdentifier } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { boundary, runComposition } from './runtime';

// ─── Finding: context providers match reads by uniqueName, ignoring scope ───────────
//
// The local-context matrix surfaced this. `askContextProvideValue` intercepts a ContextRead
// when the read's identifier has the SAME uniqueName as the provider's; it does NOT also
// check the `local` flag. So within a runtime a global provider answers a same-name LOCAL
// read, and a local provider answers a same-name GLOBAL read.
//
// Across a service boundary the read instead reaches the scope-aware read processor, so the
// two paths disagree for same-name-different-scope identifiers. These tests document the
// CURRENT behaviour; if the provider is fixed to also match on scope, they will flip.

const globalK = createContextIdentifier<string>('k', 'default');
const localK = createLocalContextIdentifier<string>('k', 'default');

describe('cross-scope context aliasing (same uniqueName)', () => {
  it('a local provider answers a same-name GLOBAL read within the runtime', async () => {
    const story = function* () {
      return yield* askContextProvideValue(localK, 'from-local', askContextRead(globalK));
    };

    expect((await runComposition(() => story())).result).toBe('from-local');
  });

  it('a global provider answers a same-name LOCAL read within the runtime', async () => {
    const story = function* () {
      return yield* askContextProvideValue(globalK, 'from-global', askContextRead(localK));
    };

    expect((await runComposition(() => story())).result).toBe('from-global');
  });

  it('but across a boundary the local provider is stripped, so the global read falls to default', async () => {
    const story = function* () {
      return yield* askContextProvideValue(
        localK,
        'from-local',
        boundary(() => askContextRead(globalK)),
      );
    };

    // The aliasing is a within-runtime artifact of the provider's interception; once the read
    // crosses into the sub-runtime it hits the scope-aware processor with no local context.
    expect((await runComposition(() => story())).result).toBe('default');
  });
});
