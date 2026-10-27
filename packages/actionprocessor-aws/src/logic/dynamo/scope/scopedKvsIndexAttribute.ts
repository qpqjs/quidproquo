import { KVS_RESERVED_MARKER, KvsCoreDataType } from 'quidproquo-core';

import { KVS_SCOPE_DELIMITER } from './scopedKvsValue';

// A scoped store's GSI can't be keyed on the raw attribute (its partitions would
// mix every scope's rows), so each one is keyed on a hidden copy holding the
// scope-composed value. These attributes carry core's reserved marker, which
// callers can't use in attribute names on a scoped store, so they can't be
// written or forged from caller data.

/** The hidden attribute a scoped store's GSI on `attributeName` is keyed on, e.g. `@@QPQGSI_customerId@@`. */
export const getScopedKvsIndexAttributeName = (attributeName: string): string => `${KVS_RESERVED_MARKER}GSI_${attributeName}@@`;

/**
 * The hidden attribute's value: `${scope}${KVS_SCOPE_DELIMITER}${value}`, always a string. A GSI partition
 * key only ever takes `=` and is never ordered on, so stringifying a number loses nothing. Callers validate
 * the value first with core's scope rules; the translator does.
 */
export const composeScopedKvsIndexValue = (scope: string, value: KvsCoreDataType): string => `${scope}${KVS_SCOPE_DELIMITER}${String(value)}`;

/** Drop every reserved-marker attribute (the hidden index copies) from a scoped row. Returns the row itself when there is nothing to drop. */
export const stripScopedKvsIndexAttributes = <T extends Record<string, any>>(item: T): T => {
  if (!Object.keys(item).some((attributeName) => attributeName.includes(KVS_RESERVED_MARKER))) {
    return item;
  }

  return Object.fromEntries(Object.entries(item).filter(([attributeName]) => !attributeName.includes(KVS_RESERVED_MARKER))) as T;
};
