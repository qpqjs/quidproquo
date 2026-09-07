import { AskResponse } from 'quidproquo-core';

import { EVENT_DOC_VALUE_INLINE_MAX_BYTES } from '../constants/eventDocValueInlineLimits';
import { serializeEventDocValue } from '../logic/serializeEventDocValue';
import { EventDocValueRef } from '../models';
import { askEventDocWriteAsset } from './askEventDocWriteAsset';

/**
 * Records a value for an event: inline when it fits `maxInlineBytes`, else as a JSON asset. A caller recording several
 * values passes its remaining event budget (0 forces an asset). Use askEventDocWriteAsset directly for real files.
 */
export function* askEventDocWriteValue(
  docId: string,
  value: unknown,
  filename: string,
  maxInlineBytes: number = EVENT_DOC_VALUE_INLINE_MAX_BYTES,
): AskResponse<EventDocValueRef> {
  const { json, bytes } = serializeEventDocValue(value);

  if (bytes <= maxInlineBytes) {
    // undefined is normalised to null because JSON.stringify(undefined) is not a string.
    return { kind: 'inline', value: value === undefined ? null : value };
  }

  const asset = yield* askEventDocWriteAsset(docId, {
    base64Data: Buffer.from(json, 'utf8').toString('base64'),
    filename,
    mimetype: 'application/json',
  });

  return { kind: 'asset', ...asset };
}
