import { EventDocAssetRef } from './EventDocAssetRef';

/**
 * A value recorded in an event: inline when small, else a JSON asset on the blob drive. For data of unpredictable size;
 * real files use EventDocAssetRef directly.
 */
export type EventDocValueRef =
  | {
      kind: 'inline';
      value: unknown;
    }
  | ({
      kind: 'asset';
    } & EventDocAssetRef);
