import { askFileStreamOpen, AskResponse, StreamEncoding, StreamHandle } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileStreamOpen<E extends StreamEncoding = 'text'>(
  drive: string,
  filepath: string,
  encoding: E = 'text' as E,
  chunkSize?: number,
): AskResponse<StreamHandle<E>> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileStreamOpen<E>(drive, filepath, encoding, chunkSize, tenantId);
}
