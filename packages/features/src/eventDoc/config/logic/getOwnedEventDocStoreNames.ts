import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { EVENT_DOC_STORE_NAME_GLOBAL } from '../../constants/eventDocGlobalNames';

/**
 * The event-doc collection stores this service owns, by store name: every store whose stream runs the projector hands
 * it its collection's store name as a global, so that is where they are read from. A store another service owns is
 * left out: its owner projects it, and its owner reprojects it.
 */
export const getOwnedEventDocStoreNames = (qpqConfig: QPQConfig): string[] =>
  qpqCoreUtils.getOwnedKeyValueStoreConfigs(qpqConfig).flatMap((store) => {
    const runtime = store.onStream?.runtime;
    const storeName = runtime && typeof runtime === 'object' ? runtime.globals?.[EVENT_DOC_STORE_NAME_GLOBAL] : undefined;

    return typeof storeName === 'string' ? [storeName] : [];
  });
