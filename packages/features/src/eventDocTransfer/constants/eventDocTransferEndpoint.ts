/** The transfer routes as the frontend addresses them; the only place the path shape is written down. */
export const eventDocTransferEndpoint = (action: 'manifest' | 'export' | 'upload' | 'plan' | 'import', version = 1): string =>
  `/v${version}/transfer/${action}`;
