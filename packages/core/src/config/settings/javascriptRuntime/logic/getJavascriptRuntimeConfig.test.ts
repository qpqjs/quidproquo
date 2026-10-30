import { describe, expect, it } from 'vitest';

import { defineJavascriptRuntime } from '../defineJavascriptRuntime';
import { JavascriptRuntimeVersion } from '../types';
import { getJavascriptRuntimeConfig } from './getJavascriptRuntimeConfig';

describe('getJavascriptRuntimeConfig', () => {
  it('falls back to the defaults when no runtime is declared', () => {
    expect(getJavascriptRuntimeConfig([])).toEqual(defineJavascriptRuntime());
  });

  it('returns the declared runtime', () => {
    expect(getJavascriptRuntimeConfig([defineJavascriptRuntime({ runtimeVersion: JavascriptRuntimeVersion.Node24 })]).runtimeVersion).toBe(
      JavascriptRuntimeVersion.Node24,
    );
  });
});
