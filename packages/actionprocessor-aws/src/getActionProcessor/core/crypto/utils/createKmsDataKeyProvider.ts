import { DataKeyProvider } from 'quidproquo-actionprocessor-node';

import { getCachedGeneratedDataKey } from '../../../../logic/kms/getCachedGeneratedDataKey';
import { getCachedUnwrappedDataKey } from '../../../../logic/kms/getCachedUnwrappedDataKey';

export const createKmsDataKeyProvider = (keyAlias: string, region: string): DataKeyProvider => ({
  generateDataKey: (context) => getCachedGeneratedDataKey(keyAlias, context, region),
  unwrapDataKey: (wrappedKey, context) => getCachedUnwrappedDataKey(wrappedKey, context, region),
});
