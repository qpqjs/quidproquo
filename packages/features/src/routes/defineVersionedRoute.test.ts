import { describe, expect, it } from 'vitest';

import { defineVersionedRoute } from './defineVersionedRoute';

// Security regression: the version prefix is the only thing the wrapper adds; method, runtime and every auth option
// reach defineRoute unchanged, so a versioned route can never be less protected than its unversioned twin.
describe('defineVersionedRoute', () => {
  it('prefixes the path with the version and passes the auth options through untouched', () => {
    const [route] = defineVersionedRoute(
      'POST',
      '/widgets',
      '/src/widgets::create',
      { routeAuthSettings: { userDirectoryName: 'users' } },
      2,
    ) as any[];

    expect(route.path).toBe('/v2/widgets');
    expect(route.method).toBe('POST');
    expect(route.runtime).toBe('/src/widgets::create');
    expect(route.options.routeAuthSettings).toMatchObject({ userDirectoryName: 'users' });
  });

  it('defaults to version 1', () => {
    const [route] = defineVersionedRoute('GET', '/widgets', '/src/widgets::list') as any[];

    expect(route.path).toBe('/v1/widgets');
  });
});
