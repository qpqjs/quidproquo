import { QPQConfig, resolveScopedKvsStoreOrThrow } from 'quidproquo-core';

import { createScopedKvsTranslator, ScopedKvsTranslator } from './scopedKvsTranslator';

/** Validate a call's scope against its store (core's resolveScopedKvsStoreOrThrow) and return the translator every dynamo kvs processor scopes its request through. */
export const getScopedKvsTranslatorOrThrow = (qpqConfig: QPQConfig, keyValueStoreName: string, scope: string | undefined): ScopedKvsTranslator =>
  createScopedKvsTranslator(scope, resolveScopedKvsStoreOrThrow(qpqConfig, keyValueStoreName, scope));
