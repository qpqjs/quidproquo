import { askNetworkRequest, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

const BUNDLE_CONTENT_TYPE = 'application/json';

/** PUTs the bundle file at the presigned url. The Content-Type must match what the presign was minted with. */
export function* askEventDocBundleUpload(uploadUrl: string, file: File): AskResponse<void> {
  const response = yield* askNetworkRequest('PUT', uploadUrl, {
    body: file,
    headers: { 'Content-Type': BUNDLE_CONTENT_TYPE },
    responseType: 'text',
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Bundle upload failed (${response.status})`);
  }
}
