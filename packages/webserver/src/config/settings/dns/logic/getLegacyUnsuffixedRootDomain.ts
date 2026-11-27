import { Nullable, QPQConfig } from '@qpqjs/core';

import { getDnsConfig } from './getDnsConfig';

/**
 * The root whose resources keep the unsuffixed names they were first deployed under, or null
 * when every root is named after itself. It need not be a declared root any more.
 *
 * TODO: remove for version 1 of quidproquo, with `legacyUnsuffixedRootDomain`.
 */
export const getLegacyUnsuffixedRootDomain = (qpqConfig: QPQConfig): Nullable<string> => getDnsConfig(qpqConfig)?.legacyUnsuffixedRootDomain ?? null;
