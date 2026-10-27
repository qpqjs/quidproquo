import { QPQConfig } from '@qpqjs/core';
// @ts-expect-error - Special build-time injected file
import { qpqConfig } from 'quidproquo-dynamic-loader';

export const getQpqConfig = (): QPQConfig => {
  return qpqConfig;
};
