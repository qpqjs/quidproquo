import { describe, expect, it } from 'vitest';

import { CryptoActionType } from './CryptoActionType';

describe('CryptoActionType', () => {
  it('should have unique action type values', () => {
    const actionTypeValues = Object.values(CryptoActionType);
    const uniqueValues = new Set(actionTypeValues);
    expect(uniqueValues.size).toBe(actionTypeValues.length);
  });

  it('should have the correct action type for Encrypt', () => {
    expect(CryptoActionType.Encrypt).toBe('@quidproquo-core/Crypto/Encrypt');
  });

  it('should have the correct action type for Decrypt', () => {
    expect(CryptoActionType.Decrypt).toBe('@quidproquo-core/Crypto/Decrypt');
  });

  it('should have the correct action type for Sign', () => {
    expect(CryptoActionType.Sign).toBe('@quidproquo-core/Crypto/Sign');
  });

  it('should have the correct action type for Verify', () => {
    expect(CryptoActionType.Verify).toBe('@quidproquo-core/Crypto/Verify');
  });

  it('should have the correct action type for GetPublicKey', () => {
    expect(CryptoActionType.GetPublicKey).toBe('@quidproquo-core/Crypto/GetPublicKey');
  });

  it('should contain all expected action types', () => {
    const expectedActionTypes = ['Encrypt', 'Decrypt', 'Sign', 'Verify', 'GetPublicKey'];

    const actualActionTypes = Object.keys(CryptoActionType);
    expect(actualActionTypes).toEqual(expect.arrayContaining(expectedActionTypes));
    expect(actualActionTypes.length).toBe(expectedActionTypes.length);
  });
});
