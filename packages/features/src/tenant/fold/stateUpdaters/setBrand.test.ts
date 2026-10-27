import { describe, expect, it } from 'vitest';

import { createInitialTenantDocumentState } from '../createInitialTenantDocumentState';
import { setBrand } from './setBrand';

// Security regression: the brand fold is an allow-list merge of colours, logo asset ref and display name; any other key
// a client puts on the event payload never lands in the document (and so never in the materialised record or the app
// header), and a logo is only ever an asset reference, not a url.
describe('setBrand', () => {
  it('folds only the three branding fields and ignores anything else on the payload', () => {
    const state = createInitialTenantDocumentState() as any;
    const payload = {
      data: {
        brandColors: { primary: '#112233', secondary: '#445566' },
        displayName: 'Acme',
        logo: { assetId: 'asset-1' },
        roles: ['tenantAdmin'],
        isAdmin: true,
        __proto__: { polluted: true },
      },
      metadata: {},
    } as any;

    const folded = setBrand(state, payload) as any;

    expect(folded.brandColors).toEqual({ primary: '#112233', secondary: '#445566' });
    expect(folded.displayName).toBe('Acme');
    expect(folded.logo).toEqual({ assetId: 'asset-1' });
    expect(folded.roles).toBeUndefined();
    expect(folded.isAdmin).toBeUndefined();
    expect(folded.polluted).toBeUndefined();
    expect(Object.keys(folded).sort()).toEqual(
      Object.keys(state)
        .concat(['brandColors', 'displayName', 'logo'].filter((k) => !(k in state)))
        .sort(),
    );
  });
});
