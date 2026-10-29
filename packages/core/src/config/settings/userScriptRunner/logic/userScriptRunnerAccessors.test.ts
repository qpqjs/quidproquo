import { describe, expect, it } from 'vitest';

import { defineUserScriptRunner } from '../defineUserScriptRunner';
import { getUserScriptRunnerConfig } from './getUserScriptRunnerConfig';
import { resolveUserScriptRunnerConfigOrThrow } from './resolveUserScriptRunnerConfigOrThrow';

describe('user script runner accessors', () => {
  it('answers null without a runner and throws on resolve', () => {
    expect(getUserScriptRunnerConfig([])).toBeNull();
    expect(() => resolveUserScriptRunnerConfigOrThrow([])).toThrow('no user script runner');
  });

  it('returns the declared runner', () => {
    expect(resolveUserScriptRunnerConfigOrThrow([defineUserScriptRunner({ timeoutInSeconds: 30 })])).toMatchObject({ timeoutInSeconds: 30 });
  });
});
