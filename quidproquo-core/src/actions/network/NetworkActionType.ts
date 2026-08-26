export enum NetworkActionType {
  Request = '@quidproquo-core/Network/Request',
}

export type HTTPMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'PATCH';

export type ResponseType = 'binary' | 'json' | 'text';

export interface HTTPRequestOptions<T> {
  basePath?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: T;
  responseType?: ResponseType;
}

export interface HTTPNetworkResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;

  // Raw Set-Cookie header lines, attributes intact, in response order. `headers` can only
  // carry the last one (fetch collapses duplicates), so multi-cookie logins need this list.
  // Always [] in browser runtimes: Set-Cookie is a forbidden response header in browser fetch.
  setCookies: string[];
}
