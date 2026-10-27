import { buildTestQpqConfig } from 'quidproquo-core';

import path from 'path';
import { describe, expect, it } from 'vitest';

import { getFullSrcPathFromQpqFunctionRuntime } from './getFullSrcPathFromQpqFunctionRuntime';

describe('getFullSrcPathFromQpqFunctionRuntime', () => {
  it('joins the basePath and relativePath for an advanced runtime', () => {
    const runtime = { basePath: '/abs/base', relativePath: 'src/handler.ts', functionName: 'handler' };

    expect(getFullSrcPathFromQpqFunctionRuntime(runtime, buildTestQpqConfig())).toBe(path.join('/abs/base', 'src/handler.ts'));
  });

  it('joins the config root with the src path for a string runtime', () => {
    const config = buildTestQpqConfig([], { configRoot: '/abs/root' });

    expect(getFullSrcPathFromQpqFunctionRuntime('/src/handlers/doThing::handler', config)).toBe(path.join('/abs/root', 'src/handlers/doThing'));
  });
});
