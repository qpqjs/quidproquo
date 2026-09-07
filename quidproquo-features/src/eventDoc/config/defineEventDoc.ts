import { defineDynamicFunctions, QPQConfig, QpqFunctionRuntime } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { getEventDocFunctionsIdentity } from '../definition/getEventDocFunctionsIdentity';
import { EventDocFunctions } from '../definition/types/EventDocFunctions';
import { defineEventDocRoutes } from '../routes/defineEventDocRoutes';
import { EventDocCollectionOptions } from '../types/EventDocCollectionOptions';
import { defineEventDocSummary } from './defineEventDocSummary';

/**
 * Store + routes in one call for the one-store-one-type case. `runtime` must resolve to the same EventDocFunctions
 * export as `functions` at request time. For several types in one store, call defineEventDocSummary once (with the
 * full snapshotFunctions map) and defineEventDocRoutes per type so the store is not defined twice.
 */
export const defineEventDoc = (functions: EventDocFunctions, runtime: QpqFunctionRuntime, options: EventDocCollectionOptions): QPQConfig => {
  const { storeName, type } = getEventDocFunctionsIdentity(functions);

  const functionsName = eventDocFunctionsName(storeName, type);

  return [
    defineDynamicFunctions(functionsName, runtime),
    defineEventDocSummary(storeName, { snapshotFunctions: { [type]: functionsName } }),
    defineEventDocRoutes({ storeName, type, ...options }),
  ];
};
