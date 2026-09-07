import { QPQBinaryData } from 'quidproquo-core';

/** One asset blob carried by value. `guid` is the doc-scoped asset id and is preserved on import so asset refs keep resolving. */
export type EventDocBundleAsset = {
  guid: string;
  data: QPQBinaryData;
};
