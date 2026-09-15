import { describe, expect, it } from 'vitest';

import { EventDocRenderKind, EventDocRenderResult } from '../models';
import { EventDocFunctions } from './types/EventDocFunctions';
import { extendEventDocFunctions } from './extendEventDocFunctions';

const definition: EventDocFunctions = {
  storeName: 'memos',
  type: 'memo',
  foldSnapshotViews: () => null,
  foldDocumentState: () => null,
  collectReferencesFromState: () => [],
  collectReferences: () => [],
  validateEvent: () => null,
};

describe('extendEventDocFunctions', () => {
  it('layers a render extension over the definition without touching it', () => {
    const render = (): EventDocRenderResult => ({ kind: EventDocRenderKind.Html, html: '<p>memo</p>' });

    const functions = extendEventDocFunctions(definition, { render });

    expect(functions.render).toBe(render);
    expect(functions.storeName).toBe('memos');
    expect(functions.foldSnapshotViews).toBe(definition.foldSnapshotViews);
    expect(definition.render).toBeUndefined();
  });

  it('returns the definition surface unchanged with no extensions', () => {
    expect(extendEventDocFunctions(definition)).toEqual(definition);
  });

  it('throws when an extension would clobber a definition member', () => {
    const withRender = { ...definition, render: () => ({ kind: EventDocRenderKind.Html, html: '' }) as EventDocRenderResult };

    const clobber = () => extendEventDocFunctions(withRender, { render: () => ({ kind: EventDocRenderKind.Html, html: 'other' }) });

    expect(clobber).toThrow('extensions are additive only');
  });
});
