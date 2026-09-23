import { describe, expect, it } from 'vitest';

import { EventDocFunctions } from '../../eventDoc';
import { TENANT_EVENT_DOC_AUTHORISER_FN, TENANT_SCOPE_RESOLVER_FN } from '../constants/tenantStoreNames';
import { defineTenantedEventDoc } from './defineTenantedEventDoc';

const docFunctions: EventDocFunctions = {
  storeName: 'docs',
  type: 'doc',
  getSnapshotCacheKey: () => '',
  foldSnapshotViews: () => null,
  foldDocumentState: () => null,
  collectReferencesFromState: () => [],
  collectReferences: () => [],
  validateEvent: () => null,
};

describe('defineTenantedEventDoc', () => {
  it('pre-wires the tenant scope resolver onto the event doc', () => {
    const config = defineTenantedEventDoc(docFunctions, '/entry/eventDocs::docEventDoc', {
      basePath: '/docs',
    });

    // The resolver name is threaded into the collection's route globals.
    expect(JSON.stringify(config)).toContain(TENANT_SCOPE_RESOLVER_FN);
    expect(JSON.stringify(config)).toContain(TENANT_EVENT_DOC_AUTHORISER_FN);
  });
});
