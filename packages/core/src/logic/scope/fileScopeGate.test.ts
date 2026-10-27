import { describe, expect, it } from 'vitest';

import { defineStorageDrive } from '../../config';
import { buildTestQpqConfig } from '../../testing';
import { assertStorageDriveScopeRequirementOrThrow, composeStorageDriveFilePathOrThrow } from './fileScopeGate';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';

const qpqConfig = buildTestQpqConfig([defineStorageDrive('tenantFiles', { scoped: true }), defineStorageDrive('assets')]);

const expectInvalidScope = (fn: () => unknown, code: InvalidScopeErrorCode) => {
  try {
    fn();
    expect.unreachable('expected InvalidScopeError');
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidScopeError);
    expect((error as InvalidScopeError).code).toBe(code);
  }
};

describe('assertStorageDriveScopeRequirementOrThrow', () => {
  it('refuses an unscoped call on a scoped drive', () => {
    expectInvalidScope(() => assertStorageDriveScopeRequirementOrThrow(qpqConfig, 'tenantFiles', undefined), InvalidScopeErrorCode.scopeRequired);
  });

  it('accepts a scoped call on a scoped drive and any call on an open drive', () => {
    expect(() => assertStorageDriveScopeRequirementOrThrow(qpqConfig, 'tenantFiles', 'TENANT#a')).not.toThrow();
    expect(() => assertStorageDriveScopeRequirementOrThrow(qpqConfig, 'assets', undefined)).not.toThrow();
  });

  it('refuses a scoped call on an unscoped drive', () => {
    expectInvalidScope(() => assertStorageDriveScopeRequirementOrThrow(qpqConfig, 'assets', 'TENANT#a'), InvalidScopeErrorCode.notScoped);
  });

  it('leaves an unknown drive for the backend to report', () => {
    expect(() => assertStorageDriveScopeRequirementOrThrow(qpqConfig, 'ghost', undefined)).not.toThrow();
    expect(() => assertStorageDriveScopeRequirementOrThrow(qpqConfig, 'ghost', 'TENANT#a')).not.toThrow();
  });
});

describe('composeStorageDriveFilePathOrThrow', () => {
  it('composes the scoped path once the gate passes', () => {
    expect(composeStorageDriveFilePathOrThrow(qpqConfig, 'tenantFiles', 'TENANT#a', 'docs/x.pdf')).toBe('TENANT#a/docs/x.pdf');
    expect(composeStorageDriveFilePathOrThrow(qpqConfig, 'assets', undefined, 'logo.png')).toBe('logo.png');
  });

  it('refuses before composing when the scope is missing', () => {
    expectInvalidScope(
      () => composeStorageDriveFilePathOrThrow(qpqConfig, 'tenantFiles', undefined, 'docs/x.pdf'),
      InvalidScopeErrorCode.scopeRequired,
    );
  });
});
