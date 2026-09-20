import { ConfigActionType, runStory, throwsError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import {
  EVENT_DOC_AUTHORISER_GLOBAL,
  EVENT_DOC_ON_APPEND_GLOBAL,
  EVENT_DOC_ON_PUBLISH_GLOBAL,
  EVENT_DOC_SCOPE_RESOLVER_GLOBAL,
} from '../constants/eventDocGlobalNames';
import { askEventDocStoreRead } from '../context/askEventDocStoreRead';
import { buildEventDocStore } from '../context/buildEventDocStore';
import { askEventDocProvideStoreFromGlobals } from './askEventDocProvideStoreFromGlobals';
import { buildEventDocStoreGlobals } from './buildEventDocStoreGlobals';

// Drift guard: the bridge reads its globals UNCONDITIONALLY (askConfigGetGlobal
// throws on a missing one), so buildEventDocStoreGlobals must provide every
// global the bridge asks for. This runs the REAL bridge against the REAL
// builder's output - a new store field wired into the bridge but not the
// builder fails here instead of at request time in every definer that
// hand-rolled its globals (the exact bug this builder replaced).
describe('buildEventDocStoreGlobals', () => {
  it('provides every global askEventDocProvideStoreFromGlobals reads', () => {
    const store = buildEventDocStore({
      storeName: 'widgets',
      type: 'widget',
      onPublish: 'syncWidget',
      onAppend: 'broadcastWidget',
      scopeResolver: 'resolveWidgetScope',
      authorise: 'authoriseWidget',
    });

    const globals = buildEventDocStoreGlobals(store);

    const resolved = runStory(askEventDocProvideStoreFromGlobals(askEventDocStoreRead()), {
      [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => {
        if (!(action.payload.globalName in globals)) {
          throw new Error(`Global config ${action.payload.globalName} not found`);
        }
        return globals[action.payload.globalName];
      },
    });

    expect(resolved).toEqual(store);
  });

  it('supports legacy consumers whose routes registered only the original core globals', () => {
    const store = buildEventDocStore({
      storeName: 'widgets',
      type: 'widget',
    });

    // Routes registered before onPublish/onAppend/scopeResolver existed have NO key at
    // all for them - the bridge must treat that as "hook not configured", not throw at
    // request time.
    const globals = { ...buildEventDocStoreGlobals(store) };
    delete globals[EVENT_DOC_ON_PUBLISH_GLOBAL];
    delete globals[EVENT_DOC_ON_APPEND_GLOBAL];
    delete globals[EVENT_DOC_SCOPE_RESOLVER_GLOBAL];
    delete globals[EVENT_DOC_AUTHORISER_GLOBAL];

    const resolved = runStory(askEventDocProvideStoreFromGlobals(askEventDocStoreRead()), {
      [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => {
        if (!(action.payload.globalName in globals)) {
          return throwsError('GenericError', `Global config ${action.payload.globalName} not found`);
        }
        return globals[action.payload.globalName];
      },
    });

    expect(resolved).toEqual({ ...store, onPublish: '', onAppend: '', scopeResolver: '', authorise: '' });
  });
});
