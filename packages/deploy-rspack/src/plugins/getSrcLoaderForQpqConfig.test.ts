// Verifies the generated bundled-loader source string: src-path resolution, the guarded
// require() emitted per runtime, and the bundleFallback:false "thin shell" branch that
// emits a fail-fast throw with NO require() (so webpack bundles no user code).
import { buildTestQpqConfig, defineFederatedModuleStore, defineInlineFunction } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getSrcLoaderForQpqConfig } from './getSrcLoaderForQpqConfig';

describe('getSrcLoaderForQpqConfig bundleFallback', () => {
  it('emits a fail-fast throw and NO require() when bundleFallback is disabled (thin shell)', () => {
    const config = buildTestQpqConfig([
      defineInlineFunction('/src/handlers/doThing::handler'),
      defineFederatedModuleStore('artifacts', { bundleFallback: false }),
    ]);

    const src = getSrcLoaderForQpqConfig(config, 'runtime');

    // No user code is bundled...
    expect(src).not.toContain('require(');
    expect(src).not.toContain('src/handlers/doThing');
    // ...and an unpublished runtime fails fast rather than silently falling back.
    expect(src).toContain('bundleFallback is disabled');
  });

  it('still bundles (emits require) when a federated store keeps the default bundleFallback', () => {
    const config = buildTestQpqConfig([defineInlineFunction('/src/handlers/doThing::handler'), defineFederatedModuleStore('artifacts')]);

    const src = getSrcLoaderForQpqConfig(config, 'runtime');

    expect(src).toContain('src/handlers/doThing');
    expect(src).toContain("module['handler']");
  });

  it('bundles a thin shell anyway when alwaysBundleStoryCode is set (dev-server build)', () => {
    const config = buildTestQpqConfig([
      defineInlineFunction('/src/handlers/doThing::handler'),
      defineFederatedModuleStore('artifacts', { bundleFallback: false }),
    ]);

    const src = getSrcLoaderForQpqConfig(config, 'runtime', true);

    expect(src).toContain('src/handlers/doThing');
    expect(src).toContain("module['handler']");
    expect(src).not.toContain('bundleFallback is disabled');
  });
});

describe('getSrcLoaderForQpqConfig', () => {
  it('returns an empty string when the config has no src entries', () => {
    expect(getSrcLoaderForQpqConfig(buildTestQpqConfig(), 'runtime')).toBe('');
  });

  it('generates a guarded require for a string src entry', () => {
    const config = buildTestQpqConfig([defineInlineFunction('/src/handlers/doThing::handler')]);

    const src = getSrcLoaderForQpqConfig(config, 'runtime');

    expect(src).toContain('src/handlers/doThing');
    expect(src).toContain("module['handler']");
  });

  it('compares basePath, relativePath and functionName for an advanced src entry', () => {
    const config = buildTestQpqConfig([defineInlineFunction({ basePath: '/abs/base', relativePath: 'src/handler.ts', functionName: 'handler' })]);

    const src = getSrcLoaderForQpqConfig(config, 'runtime');

    expect(src).toContain('runtime.basePath === String.raw`/abs/base`');
    expect(src).toContain('runtime.relativePath === String.raw`src/handler.ts`');
    expect(src).toContain('runtime.functionName === String.raw`handler`');
  });
});
