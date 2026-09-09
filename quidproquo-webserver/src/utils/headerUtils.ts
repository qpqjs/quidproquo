import { askMap, AskResponse, askThrowError, ErrorTypeEnum, QPQConfig } from 'quidproquo-core';

import { RouteOptions } from '../config/settings/route';
import { resolveHosts } from '../domain/logic/host/resolveHosts';
import { resolveOrigins } from '../domain/logic/origin/resolveOrigins';
import { DomainResolver } from '../domain/types/DomainResolver';
import { qpqHeaderIsBot, SeoEvent } from '../types';
import { HTTPEvent, HttpEventHeaders } from '../types/HTTPEvent';
import { getDefaultRouteSettings } from './qpqConfigAccessorsUtils';

export const getHeaderValue = (header: string, headers: HttpEventHeaders): string | null => {
  const headerAsLower = header.toLowerCase();
  const realHeaderKey = Object.keys(headers).find((k) => k.toLowerCase() === headerAsLower);

  if (!realHeaderKey) {
    return null;
  }

  return headers[realHeaderKey] || null;
};

export function* askReadRequiredHeader(event: HTTPEvent, requiredHeader: string): AskResponse<string> {
  const header = getHeaderValue(requiredHeader, event.headers);
  if (!header) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Header ${requiredHeader} not found`);
  }

  return header;
}

export function* askReadRequiredHeaders(event: HTTPEvent, requiredHeaders: string[]): AskResponse<string[]> {
  return yield* askMap(requiredHeaders, function* (header: string) {
    return yield* askReadRequiredHeader(event, header);
  });
}

export const getAccessTokenFromHeaders = (headers: HttpEventHeaders): string | undefined => {
  const authorizationHeader = getHeaderValue('authorization', headers) || '';
  const [authType, authToken] = authorizationHeader.split(' ');

  return authToken;
};

/** Site roots first (primary leads, so it is the fallback origin), then default and route entries, all lowercased. */
export const getAllowedOrigins = (qpqConfig: QPQConfig, route: RouteOptions, resolver?: DomainResolver): string[] => {
  const rootOrigins = resolveHosts(qpqConfig, {}, resolver).map((host) => `https://${host}`);

  const defaultAllowedOrigins = getDefaultRouteSettings(qpqConfig).flatMap((setting) =>
    (setting.routeOptions.allowedOrigins || []).flatMap((entry) => resolveOrigins(qpqConfig, entry, resolver)),
  );

  const routeAllowedOrigins = (route.allowedOrigins || []).flatMap((entry) => resolveOrigins(qpqConfig, entry, resolver));

  return [...rootOrigins, ...defaultAllowedOrigins, ...routeAllowedOrigins].map((origin) => origin.toLowerCase());
};

export const getCorsHeaders = (
  qpqConfig: QPQConfig,
  route: RouteOptions,
  reqHeaders: HttpEventHeaders,
  resolver?: DomainResolver,
): HttpEventHeaders => {
  const origin = getHeaderValue('origin', reqHeaders) || '';

  const allowedOrigins = getAllowedOrigins(qpqConfig, route, resolver);

  const allowCredentials = !!route.routeAuthSettings?.userDirectoryName;

  // If we have an auth endpoint, then we don't let wildcard origins access the API for security reasons
  // A service with no domain declares nothing browser-facing, so an open origin is the
  // only sensible fallback (the storage-drive cors default makes the same call).
  const allowOrigin =
    (!allowCredentials ? allowedOrigins.find((ao) => origin === ao || ao === '*') : allowedOrigins.find((ao) => origin === ao)) ||
    allowedOrigins[0] ||
    '*';

  // Reflect exactly what the preflight asks for instead of a blanket '*'. A
  // literal '*' is invalid once credentials are allowed (browsers reject it),
  // so echoing the requested headers/method keeps authenticated routes working
  // while staying scoped to the real request. The security boundary is the
  // origin check above; these two just describe what that trusted origin may send.
  const requestedHeaders = getHeaderValue('access-control-request-headers', reqHeaders);
  const requestedMethod = getHeaderValue('access-control-request-method', reqHeaders);

  return {
    'Access-Control-Allow-Headers': requestedHeaders || 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': requestedMethod || 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': `${allowCredentials}`,
    Vary: 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method',
  };
};

export const isBot = (event: HTTPEvent | SeoEvent<any>): boolean => {
  return event.headers[qpqHeaderIsBot] === 'true';
};
