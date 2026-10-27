import * as moreUtils from './config/utils';
import * as qpqCoreUtilsLib from './qpqCoreUtils';

// TODO: Cleanup util exports
export const qpqCoreUtils = {
  ...qpqCoreUtilsLib,
  ...moreUtils,
};
