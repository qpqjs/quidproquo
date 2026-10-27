import { describe, expect, it } from 'vitest';

import { generateUuidV5, InvalidUuidNamespaceError, InvalidUuidNamespaceErrorCode, UuidNamespace } from './generateUuidV5';

describe('generateUuidV5', () => {
  // Known-answer vectors from the uuid npm package docs and the Python uuid stdlib docs.
  it('derives the RFC 4122 v5 UUID for www.example.com in the DNS namespace', () => {
    expect(generateUuidV5('www.example.com', UuidNamespace.dns)).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');
  });

  it('derives the RFC 4122 v5 UUID for python.org in the DNS namespace', () => {
    expect(generateUuidV5('python.org', UuidNamespace.dns)).toBe('886313e1-3b8a-5372-9b90-0c9aee199e5d');
  });

  it('is deterministic for the same name and namespace', () => {
    expect(generateUuidV5('some-name', UuidNamespace.url)).toBe(generateUuidV5('some-name', UuidNamespace.url));
  });

  it('produces different UUIDs for different names', () => {
    expect(generateUuidV5('name-a', UuidNamespace.dns)).not.toBe(generateUuidV5('name-b', UuidNamespace.dns));
  });

  it('produces different UUIDs for the same name in different namespaces', () => {
    expect(generateUuidV5('same-name', UuidNamespace.dns)).not.toBe(generateUuidV5('same-name', UuidNamespace.url));
  });

  it('accepts any UUID as a custom namespace', () => {
    expect(generateUuidV5('some-name', '109156be-c4fb-41ea-b1b4-efe1671c5836')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('handles multi-byte unicode names', () => {
    expect(generateUuidV5('日本語の名前', UuidNamespace.dns)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('sets the version nibble to 5 and a valid variant nibble', () => {
    const uuid = generateUuidV5('version-check', UuidNamespace.dns);

    expect(uuid[14]).toBe('5');
    expect(uuid[19]).toMatch(/^[89ab]$/);
  });

  it('matches the canonical v5 UUID regex', () => {
    expect(generateUuidV5('regex-check', UuidNamespace.dns)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('throws for a namespace that is not a valid UUID', () => {
    expect(() => generateUuidV5('some-name', 'not-a-uuid')).toThrow('Invalid namespace UUID [not-a-uuid]');
  });

  it('throws a discriminable InvalidUuidNamespaceError with the notAUuid code', () => {
    let caught: unknown;
    try {
      generateUuidV5('some-name', 'not-a-uuid');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(InvalidUuidNamespaceError);
    expect((caught as InvalidUuidNamespaceError).code).toBe(InvalidUuidNamespaceErrorCode.notAUuid);
  });
});
