import { HTTPMethod } from '@qpqjs/core';

export type SeoEventHeaders = {
  [key: string]: undefined | string;
};

export type SeoEventRouteParams = {
  [key: string]: string;
};

export type SeoEvent<T = null> = {
  path: string;
  query: { [key: string]: undefined | string | string[] };
  body: T;
  headers: SeoEventHeaders;
  method: HTTPMethod;
  correlation: string;
  sourceIp: string;
  domain: string;
};

export type SeoEventResponse = {
  fallbackToCDN?: boolean;
  status: number;
  body?: string;
  headers?: SeoEventHeaders;
  bodyEncoding?: 'binary' | 'base64';
};
