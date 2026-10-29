import { createContextIdentifier } from '@qpqjs/core';

import { BaseUrls } from '../types/BaseUrls';

/** Where the admin app's api and websocket live; the App provides the real urls, these defaults suit a local dev server. */
export const baseUrlsContext = createContextIdentifier<BaseUrls>('qpq-admin-base-urls', {
  api: 'http://localhost:8080',
  ws: 'ws://localhost:8080',
});
