/**
 * Decodes a qpq page key (base64) back into the raw Cognito PaginationToken.
 * Returns undefined rather than null so the result can feed the SDK's optional
 * PaginationToken field directly.
 */
export function pageKeyToPaginationToken(pageKey?: string): string | undefined {
  if (!pageKey) {
    return undefined;
  }

  return Buffer.from(pageKey, 'base64').toString();
}
