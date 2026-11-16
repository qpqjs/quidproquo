import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { askEventDocReadOwnedStoreNames } from '../../actions/askEventDocReadOwnedStoreNames';
import { getOwnedEventDocStoreNames } from '../../config/logic/getOwnedEventDocStoreNames';

const getProcessReadOwnedStoreNames = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventDocReadOwnedStoreNames> => {
  const storeNames = getOwnedEventDocStoreNames(qpqConfig);

  return async () => actionResult(storeNames);
};

/** Answers askEventDocReadOwnedStoreNames from the service's own config. A pure config read, so one implementation serves every runtime. */
export const getEventDocReadOwnedStoreNames = createActionProcessor(askEventDocReadOwnedStoreNames, getProcessReadOwnedStoreNames);
