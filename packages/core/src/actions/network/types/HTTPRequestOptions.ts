import { ResponseType } from './ResponseType';

export type HTTPRequestOptions<T> = {
  basePath?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: T;
  responseType?: ResponseType;
};
