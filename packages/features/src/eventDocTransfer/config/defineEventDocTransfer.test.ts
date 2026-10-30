import { QPQCoreConfigSettingType } from '@qpqjs/core';
import { QPQWebServerConfigSettingType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { defineTenantedEventDocTransfer } from '../../tenant/config/defineTenantedEventDocTransfer';
import { TENANT_EVENT_DOC_AUTHORISER_FN } from '../../tenant/constants/tenantStoreNames';
import { EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL, EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL, EVENT_DOC_TRANSFER_SERVICE_GLOBAL } from '../constants';
import { defineEventDocTransfer } from './defineEventDocTransfer';

const collections = [{ storeName: 'templates', type: 'template' }];

// A live functions object as a service would list one (identity + behaviour members).
const templateFunctions = {
  storeName: 'templates',
  type: 'template',
  getSnapshotCacheKey: () => '',
  foldSnapshotViews: () => null,
  foldDocumentState: () => null,
  collectReferencesFromState: () => [],
  collectReferences: () => [],
  validateEvent: () => null,
};

// The config is a flat array of settings; routes are the ones carrying a runtime with globals.
const routeGlobals = (config: unknown[]): Record<string, unknown>[] =>
  config
    .flat(Infinity)
    .filter((setting): setting is { configSettingType: string; runtime: { globals?: Record<string, unknown> } } => {
      const candidate = setting as { configSettingType?: string };
      return candidate.configSettingType === QPQWebServerConfigSettingType.Route;
    })
    .map((setting) => setting.runtime.globals ?? {});

describe('defineEventDocTransfer', () => {
  it('gives every route the registry it needs to resolve a collection', () => {
    const globals = routeGlobals(defineEventDocTransfer({ service: 'template', collections }));

    expect(globals).not.toHaveLength(0);
    expect(globals.every((entry) => entry[EVENT_DOC_TRANSFER_SERVICE_GLOBAL] === 'template')).toBe(true);
    expect(globals.every((entry) => Array.isArray(entry[EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL]))).toBe(true);
  });

  it('emits the user directory global when the routes are authed', () => {
    // Regression: the tenant scope resolver runs on every transfer request and reaches
    // askEventDocResolveUserId, which reads this global. Without it the first call fails with
    // "Global config eventDocUserDirectory not found" - the same contract defineEventDocRoutes,
    // defineTenantRoutes and defineEventDocAi all honour.
    const config = defineEventDocTransfer({
      service: 'template',
      collections,
      routeAuthSettings: { userDirectoryName: 'docgen-users' },
    });

    expect(routeGlobals(config).every((entry) => entry[EVENT_DOC_USER_DIRECTORY_GLOBAL] === 'docgen-users')).toBe(true);
  });

  it('leaves the directory global unset when the routes are open', () => {
    const globals = routeGlobals(defineEventDocTransfer({ service: 'template', collections }));

    expect(globals.every((entry) => !(EVENT_DOC_USER_DIRECTORY_GLOBAL in entry))).toBe(true);
  });

  it('normalizes a live functions object to its bare identity in the registry', () => {
    const globals = routeGlobals(defineEventDocTransfer({ service: 'template', collections: [templateFunctions] }));

    expect(globals![0]![EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL]).toEqual([{ storeName: 'templates', type: 'template', onPublish: '', onAppend: '' }]);
  });

  it('accepts a collection-list entry carrying its functions object, unmapped', () => {
    const listEntry = { functions: templateFunctions, runtime: '/entry/eventDocs::templateEventDoc', basePath: '/templates' };
    const globals = routeGlobals(defineEventDocTransfer({ service: 'template', collections: [listEntry] }));

    expect(globals![0]![EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL]).toEqual([{ storeName: 'templates', type: 'template', onPublish: '', onAppend: '' }]);
  });

  it('provisions the staging drive', () => {
    const config = (defineEventDocTransfer({ service: 'template', collections }) as any[]).flat(Infinity) as { configSettingType: string }[];

    expect(config.some((setting) => setting.configSettingType === QPQCoreConfigSettingType.storageDrive)).toBe(true);
  });
});

// Security regression: a transfer reads every collection and rewrites their logs, so inside a tenant it must run the
// same per-collection authoriser the collections' own routes do. The tenanted definer wires the tenant authoriser in.
describe('defineEventDocTransfer authorise', () => {
  it('carries the collection authoriser to every transfer route', () => {
    const globals = routeGlobals(defineEventDocTransfer({ service: 'template', collections, authorise: 'docs-authorise' }));

    expect(globals.every((entry) => entry[EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL] === 'docs-authorise')).toBe(true);
  });

  it('carries an empty authoriser when none is declared', () => {
    const globals = routeGlobals(defineEventDocTransfer({ service: 'template', collections }));

    expect(globals.every((entry) => entry[EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL] === '')).toBe(true);
  });

  it('gates a tenanted transfer with the tenant authoriser', () => {
    const globals = routeGlobals(defineTenantedEventDocTransfer({ service: 'template', collections }));

    expect(globals.every((entry) => entry[EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL] === TENANT_EVENT_DOC_AUTHORISER_FN)).toBe(true);
  });
});
