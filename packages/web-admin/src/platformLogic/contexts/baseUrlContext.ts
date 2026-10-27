import { createContextIdentifier } from 'quidproquo-core';

export type BaseUrls = {
  api: string;
  ws: string;
};

export const baseUrlsContext = createContextIdentifier<BaseUrls>('qpq-admin-base-urls', {
  api: 'http://localhost:8080',
  ws: 'ws://localhost:8080',
});
