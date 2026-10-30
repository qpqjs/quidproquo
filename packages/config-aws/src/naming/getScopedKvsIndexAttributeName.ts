import { KVS_RESERVED_MARKER } from '@qpqjs/core';

// A scoped store's index can't be keyed on the raw attribute (its partitions would mix every
// scope's rows), so each one is keyed on a hidden copy holding the scope-composed value. The
// name carries core's reserved marker, which callers can't use in attribute names on a scoped
// store, so it can't be written or forged from caller data. Deploy and runtime both name the
// attribute through here.
/** The hidden attribute a scoped store's index on `attributeName` is keyed on, e.g. `@@QPQGSI_customerId@@`. */
export const getScopedKvsIndexAttributeName = (attributeName: string): string => `${KVS_RESERVED_MARKER}GSI_${attributeName}@@`;
