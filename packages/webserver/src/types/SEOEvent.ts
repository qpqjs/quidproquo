import { HTTPMethod } from 'quidproquo-core';

export interface SeoEventHeaders {
  [key: string]: undefined | string;
}

export interface SeoEventRouteParams {
  [key: string]: string;
}

export interface SeoEvent<T = null> {
  path: string;
  query: { [key: string]: undefined | string | string[] };
  body: T;
  headers: SeoEventHeaders;
  method: HTTPMethod;
  correlation: string;
  sourceIp: string;
  domain: string;
}

export interface SeoEventResponse {
  fallbackToCDN?: boolean;
  status: number;
  body?: string;
  headers?: SeoEventHeaders;
  bodyEncoding?: 'binary' | 'base64';
}
