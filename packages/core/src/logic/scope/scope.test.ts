import { describe, expect, it } from 'vitest';

import { composeScopedFilePath } from './composeScopedFilePath';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';
import { stripScopedFilePath } from './stripScopedFilePath';
import { validateScopeSegment } from './validateScopeSegment';

const expectInvalidScope = (fn: () => unknown, code: InvalidScopeErrorCode) => {
  try {
    fn();
    expect.unreachable('expected InvalidScopeError');
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidScopeError);
    expect((error as InvalidScopeError).code).toBe(code);
  }
};

describe('validateScopeSegment', () => {
  it('accepts opaque ids', () => {
    expect(() => validateScopeSegment('0198f2ab-6cf2-7bbc-9c33-7a2d1f0a1c11')).not.toThrow();
    expect(() => validateScopeSegment('org-abc_123')).not.toThrow();
  });

  it('rejects empty and whitespace-only scopes', () => {
    expectInvalidScope(() => validateScopeSegment(''), InvalidScopeErrorCode.empty);
    expectInvalidScope(() => validateScopeSegment('   '), InvalidScopeErrorCode.empty);
  });

  it('rejects separators, traversal sequences, and null bytes', () => {
    expectInvalidScope(() => validateScopeSegment('a/b'), InvalidScopeErrorCode.unsafeCharacters);
    expectInvalidScope(() => validateScopeSegment('a\\b'), InvalidScopeErrorCode.unsafeCharacters);
    expectInvalidScope(() => validateScopeSegment('..'), InvalidScopeErrorCode.unsafeCharacters);
    expectInvalidScope(() => validateScopeSegment('a..b'), InvalidScopeErrorCode.unsafeCharacters);
    expectInvalidScope(() => validateScopeSegment('a\0b'), InvalidScopeErrorCode.unsafeCharacters);
  });

  it('rejects the kvs scope delimiter character', () => {
    // A scope containing '@' could forge or shadow another scope's composed
    // prefix ('a@' + '@QPQSCOPE@@b' vs 'a' + '@@QPQSCOPE@@b').
    expectInvalidScope(() => validateScopeSegment('a@b'), InvalidScopeErrorCode.unsafeCharacters);
    expectInvalidScope(() => validateScopeSegment('acme@@QPQSCOPE@@'), InvalidScopeErrorCode.unsafeCharacters);
  });

  it('accepts scopes containing ":" (no longer the delimiter character)', () => {
    expect(() => validateScopeSegment('a:b')).not.toThrow();
  });

  it('rejects the self-referencing path segment', () => {
    // './file' composed under scope '.' resolves to the unscoped root.
    expectInvalidScope(() => validateScopeSegment('.'), InvalidScopeErrorCode.unsafeCharacters);
  });

  it('rejects overly long scopes', () => {
    expectInvalidScope(() => validateScopeSegment('x'.repeat(129)), InvalidScopeErrorCode.tooLong);
    expect(() => validateScopeSegment('x'.repeat(128))).not.toThrow();
  });
});

describe('composeScopedFilePath', () => {
  it('returns the filepath unchanged without a scope', () => {
    expect(composeScopedFilePath(undefined, 'a/b.txt')).toBe('a/b.txt');
  });

  it('prefixes the scope as a single path segment', () => {
    expect(composeScopedFilePath('scope-a', 'a/b.txt')).toBe('scope-a/a/b.txt');
  });

  it('rejects an invalid scope', () => {
    expectInvalidScope(() => composeScopedFilePath('../evil', 'a.txt'), InvalidScopeErrorCode.unsafeCharacters);
  });

  it('rejects a filepath that could traverse out of the scope', () => {
    expectInvalidScope(() => composeScopedFilePath('scope-a', '../scope-b/secret.txt'), InvalidScopeErrorCode.unsafePath);
    expectInvalidScope(() => composeScopedFilePath('scope-a', 'a/../../scope-b/secret.txt'), InvalidScopeErrorCode.unsafePath);
    expectInvalidScope(() => composeScopedFilePath('scope-a', 'a\\..\\b.txt'), InvalidScopeErrorCode.unsafePath);
    expectInvalidScope(() => composeScopedFilePath('scope-a', '/etc/passwd'), InvalidScopeErrorCode.unsafePath);
    expectInvalidScope(() => composeScopedFilePath('scope-a', 'a\0b.txt'), InvalidScopeErrorCode.unsafePath);
  });

  it('allows dot-prefixed names that are not traversal segments', () => {
    expect(composeScopedFilePath('scope-a', '.hidden/..file.txt')).toBe('scope-a/.hidden/..file.txt');
  });
});

describe('stripScopedFilePath', () => {
  it('round-trips with composeScopedFilePath', () => {
    expect(stripScopedFilePath('scope-a', composeScopedFilePath('scope-a', 'a/b.txt'))).toBe('a/b.txt');
  });

  it('passes paths through untouched without a scope', () => {
    expect(stripScopedFilePath(undefined, 'scope-a/a/b.txt')).toBe('scope-a/a/b.txt');
  });

  it('leaves an unscoped stored path unchanged', () => {
    expect(stripScopedFilePath('scope-a', 'a/b.txt')).toBe('a/b.txt');
  });
});
