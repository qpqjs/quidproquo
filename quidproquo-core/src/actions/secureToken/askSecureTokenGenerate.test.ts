import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askSecureTokenGenerate } from './askSecureTokenGenerate';
import { SecureTokenActionType } from './SecureTokenActionType';

describe('askSecureTokenGenerate', () => {
  it('yields a Generate action for 32 bytes by default', () => {
    const { action } = captureRequester(askSecureTokenGenerate());

    expect(action).toEqual({ type: SecureTokenActionType.Generate, payload: { byteLength: 32 } });
  });

  it('carries the byte length asked for', () => {
    const { action } = captureRequester(askSecureTokenGenerate(48));

    expect(action).toEqual({ type: SecureTokenActionType.Generate, payload: { byteLength: 48 } });
  });

  it('returns the token the runtime resolves', () => {
    const { returned } = captureRequester(askSecureTokenGenerate(), 'ab'.repeat(32));

    expect(returned).toBe('ab'.repeat(32));
  });

  it('declares its error types', () => {
    expect(askSecureTokenGenerate.errorType.InvalidByteLength).toBeDefined();
    expect(askSecureTokenGenerate.errorType.RandomSourceUnavailable).toBeDefined();
  });
});
