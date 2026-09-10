import { QPQCoreConfigSettingType } from 'quidproquo-core';
import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import {
  TENANT_CONNECTION_SCOPE_RESOLVER_FN,
  TENANT_DOC_TYPE,
  TENANT_EVENTDOC_STORE,
  TENANT_SCOPE_RESOLVER_FN,
  TENANT_MEMBERSHIPS_STORE,
} from '../constants/tenantStoreNames';
import { defineTenant } from './defineTenant';

const config = defineTenant({
  owner: { module: 'owner-svc' },
  basePath: '/tenants',
  myTenantsBasePath: '/my-tenants',
  routeAuthSettings: { userDirectoryName: 'users' },
});

// The owner's settings arrive as arbitrarily nested config arrays (qpq flattens
// them at load); the routes are what we assert paths against.
const ownerRoutes = (): { method: string; path: string }[] => {
  const serviceSettings = config.find(
    (s) => (s as { configSettingType: string }).configSettingType === QPQCoreConfigSettingType.serviceSettings,
  ) as unknown as {
    settingsByService: Record<string, unknown[]>;
  };

  return serviceSettings.settingsByService['owner-svc']
    .flat(Infinity)
    .filter((s) => (s as { configSettingType: string }).configSettingType === QPQWebServerConfigSettingType.Route) as {
    method: string;
    path: string;
  }[];
};

describe('defineTenant', () => {
  it('always registers the request + connection scope resolver inline functions', () => {
    const inlineFnNames = config
      .filter((s) => (s as { configSettingType: string }).configSettingType === QPQCoreConfigSettingType.inlineFunction)
      .map((s) => (s as unknown as { functionName: string }).functionName);

    expect(inlineFnNames).toEqual(expect.arrayContaining([TENANT_SCOPE_RESOLVER_FN, TENANT_CONNECTION_SCOPE_RESOLVER_FN]));
  });

  it('declares the membership table owned by the owner (a cross-module ref elsewhere)', () => {
    const membershipStore = config.find(
      (s) =>
        (s as { configSettingType: string }).configSettingType === QPQCoreConfigSettingType.keyValueStore &&
        (s as { uniqueKey: string }).uniqueKey.includes(TENANT_MEMBERSHIPS_STORE),
    ) as { owner?: unknown };

    // The owner field alone decides owned-vs-foreign at deploy - no service-gating.
    expect(membershipStore.owner).toEqual({ module: 'owner-svc' });

    // pk userId / sk tenantId for the access check; a tenantId GSI for the member list.
    const store = membershipStore as unknown as {
      partitionKey: { key: string };
      sortKeys: { key: string }[];
      indexes: { partitionKey: { key: string }; sortKey?: { key: string } }[];
    };
    expect(store.partitionKey.key).toBe('userId');
    expect(store.sortKeys.map((k) => k.key)).toEqual(['tenantId']);
    expect(store.indexes).toEqual([{ partitionKey: { key: 'tenantId', type: 'string' }, sortKey: { key: 'userId', type: 'string' } }]);
  });

  it('gates the rest of the registry to the owner service', () => {
    const serviceSettings = config.find(
      (s) => (s as { configSettingType: string }).configSettingType === QPQCoreConfigSettingType.serviceSettings,
    ) as unknown as { settingsByService: Record<string, unknown[]> };

    expect(Object.keys(serviceSettings.settingsByService)).toEqual(['owner-svc']);
  });

  it('scopes the tenant collection itself with the standard tenant scope resolver', () => {
    const serviceSettings = config.find(
      (s) => (s as { configSettingType: string }).configSettingType === QPQCoreConfigSettingType.serviceSettings,
    ) as unknown as { settingsByService: Record<string, unknown[]> };

    // The standard resolver is threaded into the tenant collection's own route
    // globals (the {basePath} CRUD and the {myTenantsBasePath} membership routes) -
    // without it every authenticated user could read and mutate every tenant's
    // doc. The tenant collection is an ordinary tenanted collection.
    const ownerSettings = JSON.stringify(serviceSettings.settingsByService['owner-svc']);
    const occurrences = ownerSettings.split(TENANT_SCOPE_RESOLVER_FN).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it('registers the registry definition and points the snapshot projector at it', () => {
    const serviceSettings = config.find(
      (s) => (s as { configSettingType: string }).configSettingType === QPQCoreConfigSettingType.serviceSettings,
    ) as unknown as { settingsByService: Record<string, unknown[]> };

    const ownerSettings = serviceSettings.settingsByService['owner-svc'].flat(Infinity) as {
      configSettingType: string;
      dynamicFunctionsName?: string;
      onStream?: { runtime: { globals?: Record<string, unknown> } };
    }[];

    const functionsName = eventDocFunctionsName(TENANT_EVENTDOC_STORE, TENANT_DOC_TYPE);

    // The dynamic-functions registration under the conventional name...
    const registration = ownerSettings.find((s) => s.dynamicFunctionsName === functionsName);
    expect(registration).toBeDefined();

    // ...and the event log's stream projector wired to fold tenant snapshots through
    // it (the map rides the stream runtime's globals — see defineEventDocSummary).
    const snapshotMaps = ownerSettings
      .map((s) => s.onStream?.runtime.globals?.[EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL] as Record<string, string> | undefined)
      .filter(Boolean);
    expect(snapshotMaps).toContainEqual({ [TENANT_DOC_TYPE]: functionsName });
  });

  it('mounts the tenant collection at basePath, named after the model type', () => {
    const paths = ownerRoutes().map((r) => `${r.method} ${r.path}`);

    // The stock eventDoc CRUD, at the collection root like every other collection
    // (/templates, /styles) - not under a mechanism-named child path.
    expect(paths).toEqual(
      expect.arrayContaining(['GET /v1/tenants', 'GET /v1/tenants/{id}', 'GET /v1/tenants/{id}/events', 'DELETE /v1/tenants/{id}']),
    );
  });

  it('mounts the membership-gated routes at myTenantsBasePath', () => {
    const paths = ownerRoutes().map((r) => `${r.method} ${r.path}`);

    expect(paths).toEqual(
      expect.arrayContaining([
        'GET /v1/my-tenants',
        'POST /v1/my-tenants',
        'GET /v1/my-tenants/{id}',
        'GET /v1/my-tenants/{id}/logo',
        'GET /v1/my-tenants/{id}/members',
        'POST /v1/my-tenants/{id}/members',
        'PATCH /v1/my-tenants/{id}/members/{userId}',
        'DELETE /v1/my-tenants/{id}/members/{userId}',
      ]),
    );
  });

  it('leaves create to the membership route, so a new tenant always links its creator', () => {
    const creates = ownerRoutes().filter((r) => r.method === 'POST' && r.path === '/v1/tenants');

    // The stock eventDoc create would make a doc with no membership link - a tenant
    // nothing can list again. POST /v1/my-tenants is the only way in.
    expect(creates).toEqual([]);
  });

  it('mounts no literal route that a tenant id could be mistaken for', () => {
    // The regression this layout exists to prevent: `{basePath}/{id}` matches any
    // single segment, so a sibling `{basePath}/<literal>` is ambiguous with that id
    // and the router picks by path-length precedence, not by intent. ('/tenants/docs'
    // used to resolve to the tenant record get with id='docs' -> Forbidden.)
    const idRoutes = ownerRoutes().filter((r) => r.path.endsWith('/{id}'));
    expect(idRoutes.length).toBeGreaterThan(0);

    for (const idRoute of idRoutes) {
      const root = idRoute.path.slice(0, -'/{id}'.length);

      // A same-method sibling that is exactly one literal segment under the same
      // root is what `{id}` would swallow.
      const ambiguous = ownerRoutes().filter((r) => {
        if (r.method !== idRoute.method || r.path === idRoute.path) {
          return false;
        }
        if (!r.path.startsWith(`${root}/`)) {
          return false;
        }
        const segment = r.path.slice(root.length + 1);
        return segment.length > 0 && !segment.includes('/') && !segment.includes('{');
      });

      expect(ambiguous).toEqual([]);
    }
  });
});
