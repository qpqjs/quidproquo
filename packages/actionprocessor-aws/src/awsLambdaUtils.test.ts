import { StorageDriveTier } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { findApiRoute, getS3BucketStorageClassFromStorageDriveTier, matchRoutePath, matchUrl, randomGuid } from './awsLambdaUtils';

describe('randomGuid', () => {
  it('returns a v4-shaped uuid', () => {
    expect(randomGuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns a different value each call', () => {
    expect(randomGuid()).not.toBe(randomGuid());
  });
});

describe('matchUrl', () => {
  it('matches a templated path and extracts its params', () => {
    expect(matchUrl('/attempt/{attemptUuid}/result/{test}', '/attempt/123/result/abc')).toEqual({
      didMatch: true,
      params: { attemptUuid: '123', test: 'abc' },
    });
  });

  it('matches a static path with no params', () => {
    const result = matchUrl('/health', '/health');

    expect(result.didMatch).toBe(true);
  });

  it('does not match when the path differs', () => {
    expect(matchUrl('/attempt/{id}', '/result/123').didMatch).toBe(false);
  });

  // Security regression: a parameter is one segment and the whole url must match, so a request can never reach a
  // route through an extra segment, a prefix or an encoded slash.
  it('never lets a parameter span a slash or a request match as a prefix', () => {
    expect(matchUrl('/users/{id}', '/users/a/b').didMatch).toBe(false);
    expect(matchUrl('/users/{id}', '/users/a%2Fb').params).toEqual({ id: 'a%2Fb' });
    expect(matchUrl('/users', '/users/extra').didMatch).toBe(false);
    expect(matchUrl('/users', '/usersextra').didMatch).toBe(false);
    expect(matchUrl('/users/{id}', '/users/').didMatch).toBe(false);
  });
});

describe('matchRoutePath', () => {
  it('percent-decodes each param after matching', () => {
    expect(matchRoutePath('/log/{id}', '/log/svc%3A%3Aabc%20d')).toEqual({ didMatch: true, params: { id: 'svc::abc d' } });
    expect(matchRoutePath('/users/{id}', '/users/a%2Fb').params).toEqual({ id: 'a/b' });
  });

  it('matches a static path and reports no params', () => {
    expect(matchRoutePath('/health', '/health').didMatch).toBe(true);
    expect(matchRoutePath('/health', '/other').didMatch).toBe(false);
  });

  // Security regression: the match runs on the encoded path, so an encoded slash never reaches a different route or
  // adds a segment, and a malformed escape is a clean no-match instead of an unhandled URIError.
  it('never routes through an encoded separator and never throws on a malformed escape', () => {
    expect(matchRoutePath('/users/{id}', '/users/a%2Fb/c').didMatch).toBe(false);
    expect(matchRoutePath('/users/{id}', '/users/%E0')).toEqual({ didMatch: false, params: null });
    expect(matchRoutePath('/users/{id}', '/users/100%').didMatch).toBe(false);
  });
});

describe('findApiRoute', () => {
  const route = (method: string, path: string) => ({ method, path, runtime: { src: path, runtimeType: 'Function' }, options: {} }) as any;

  // Security regression: a literal segment always beats a sibling parameter, so `/admin/me` can never be served by the
  // `/admin/{id}` handler, and a method mismatch is no match at all.
  it('prefers the literal route over a parameter sibling and respects the method', () => {
    const routes = [route('GET', '/admin/{id}'), route('GET', '/admin/me'), route('POST', '/admin/{id}')];

    expect(findApiRoute(routes, 'GET', '/admin/me')?.route.path).toBe('/admin/me');
    expect(findApiRoute(routes, 'GET', '/admin/other')?.route.path).toBe('/admin/{id}');
    expect(findApiRoute(routes, 'DELETE', '/admin/me')).toBeNull();
  });

  it('hands the handler decoded params', () => {
    const routes = [route('GET', '/admin/{id}')];

    expect(findApiRoute(routes, 'GET', '/admin/svc%3A%3A1')?.match.params).toEqual({ id: 'svc::1' });
    expect(findApiRoute(routes, 'GET', '/admin/%E0')).toBeNull();
  });
});

describe('getS3BucketStorageClassFromStorageDriveTier', () => {
  it.each([
    [StorageDriveTier.REGULAR, 'STANDARD'],
    [StorageDriveTier.OCCASIONAL_ACCESS, 'STANDARD_IA'],
    [StorageDriveTier.SINGLE_ZONE_OCCASIONAL_ACCESS, 'ONEZONE_IA'],
    [StorageDriveTier.COLD_STORAGE, 'GLACIER'],
    [StorageDriveTier.COLD_STORAGE_INSTANT_ACCESS, 'GLACIER_IR'],
    [StorageDriveTier.DEEP_COLD_STORAGE, 'DEEP_ARCHIVE'],
    [StorageDriveTier.SMART_TIERING, 'INTELLIGENT_TIERING'],
  ])('maps %s to the %s storage class', (tier: StorageDriveTier, expected: string) => {
    expect(getS3BucketStorageClassFromStorageDriveTier(tier)).toBe(expected);
  });

  it('defaults to INTELLIGENT_TIERING when the tier is omitted', () => {
    expect(getS3BucketStorageClassFromStorageDriveTier()).toBe('INTELLIGENT_TIERING');
  });
});
