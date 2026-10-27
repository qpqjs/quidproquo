// Verifies the build-side expose derivation: container-name sanitization, config-root-
// relative expose paths, dedupe of multiple runtimes in one file, and (critically) that
// advanced-runtime manifest keys are machine-INDEPENDENT (no absolute basePath), so a
// remote published on one machine matches a lambda shell built on another.
import { buildTestQpqConfig, defineInlineFunction } from 'quidproquo-core';

import path from 'path';
import { describe, expect, it } from 'vitest';

import { getFederatedRemoteInfoForQpqConfig } from './getFederatedRemoteInfoForQpqConfig';

describe('getFederatedRemoteInfoForQpqConfig', () => {
  it('exposes a string runtime under its config-root-relative path', () => {
    const config = buildTestQpqConfig([defineInlineFunction('/src/handlers/doThing::handler')], { configRoot: '/abs/root' });

    const info = getFederatedRemoteInfoForQpqConfig(config);

    expect(info.exposes['./src/handlers/doThing']).toBe(path.join('/abs/root', 'src/handlers/doThing'));
    expect(info.runtimeExposeMap['/src/handlers/doThing::handler']).toBe('src/handlers/doThing');
  });

  it('dedupes multiple runtimes from the same source file into one expose', () => {
    const config = buildTestQpqConfig(
      [defineInlineFunction('/src/handlers/doThing::handler'), defineInlineFunction('/src/handlers/doThing::otherHandler')],
      { configRoot: '/abs/root' },
    );

    const info = getFederatedRemoteInfoForQpqConfig(config);

    expect(Object.keys(info.exposes)).toEqual(['./src/handlers/doThing']);
    expect(info.runtimeExposeMap['/src/handlers/doThing::handler']).toBe('src/handlers/doThing');
    expect(info.runtimeExposeMap['/src/handlers/doThing::otherHandler']).toBe('src/handlers/doThing');
  });

  it('exposes an advanced runtime outside the config root under a stable hashed key', () => {
    const runtime = { basePath: '/somewhere/else', relativePath: 'src/handler', functionName: 'handler' };
    const config = buildTestQpqConfig([defineInlineFunction(runtime)], { configRoot: '/abs/root' });

    const info = getFederatedRemoteInfoForQpqConfig(config);

    // Keyed machine-independently (relativePath::functionName, NOT the absolute basePath)
    const exposePath = info.runtimeExposeMap['src/handler::handler'];
    expect(exposePath).toMatch(/^external\/[0-9a-f]{16}\/handler$/);
    expect(info.exposes[`./${exposePath}`]).toBe(path.join('/somewhere/else', 'src/handler'));

    // Deterministic across calls - the lambda-side manifest lookup depends on it
    expect(getFederatedRemoteInfoForQpqConfig(config).runtimeExposeMap['src/handler::handler']).toBe(exposePath);
  });

  it('keys an advanced runtime independently of the build machine basePath', () => {
    // Same logical runtime, built/published from two different checkout paths - the
    // manifest key MUST match or a lambda built elsewhere silently runs stale code.
    const onMachineA = { basePath: '/home/ci/repo/src', relativePath: 'svc/entry/hello', functionName: 'hello' };
    const onMachineB = { basePath: '/Users/dev/repo/src', relativePath: 'svc/entry/hello', functionName: 'hello' };

    const keysA = Object.keys(getFederatedRemoteInfoForQpqConfig(buildTestQpqConfig([defineInlineFunction(onMachineA)])).runtimeExposeMap);
    const keysB = Object.keys(getFederatedRemoteInfoForQpqConfig(buildTestQpqConfig([defineInlineFunction(onMachineB)])).runtimeExposeMap);

    expect(keysA).toEqual(['svc/entry/hello::hello']);
    expect(keysB).toEqual(keysA);
  });
});
