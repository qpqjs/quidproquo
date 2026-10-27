/**
 * Encodes a raw Cognito PaginationToken as an opaque base64 page key for
 * QpqPagedData. Returns undefined rather than null so the result can feed the
 * optional nextPageKey field directly.
 */
export function paginationTokenToPageKey(paginationToken?: string): string | undefined {
  if (!paginationToken) {
    return undefined;
  }

  return Buffer.from(paginationToken).toString('base64');
}
