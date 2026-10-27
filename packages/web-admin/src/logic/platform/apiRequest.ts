import { HTTPNetworkResponse } from 'quidproquo-core';
import { preformNetworkRequest } from 'quidproquo-webserver';

const getHeaders = (accessToken?: string) => ({
  'Content-Type': 'application/json',
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

const unwrap = <T>(response: HTTPNetworkResponse<T>): T => {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.data;
};

export const apiRequestPost = async <T = any>(path: string, body: object, apiBaseUrl: string, accessToken?: string): Promise<T> => {
  const response = await preformNetworkRequest<T>({
    method: 'POST',
    url: path,
    basePath: apiBaseUrl,
    headers: getHeaders(accessToken),
    body,
    responseType: 'json',
  });

  return unwrap(response);
};

export const apiRequestGet = async <T = any>(path: string, apiBaseUrl: string, accessToken?: string): Promise<T> => {
  const response = await preformNetworkRequest<T>({
    method: 'GET',
    url: path,
    basePath: apiBaseUrl,
    headers: getHeaders(accessToken),
    responseType: 'json',
  });

  return unwrap(response);
};

export const externalRequestGet = async <T = any>(path: string): Promise<T> => {
  const response = await preformNetworkRequest<T>({
    method: 'GET',
    url: path,
    headers: getHeaders(),
    responseType: 'json',
  });

  return unwrap(response);
};
