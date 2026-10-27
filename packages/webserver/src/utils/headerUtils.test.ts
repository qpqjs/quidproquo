import { buildTestQpqConfig, ErrorTypeEnum, runStory, StoryError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineDefaultRouteOptions } from '../config/settings/defaultRouteOptions';
import { defineDns } from '../config/settings/dns';
import { RouteOptions } from '../config/settings/route';
import { qpqHeaderIsBot } from '../types';
import { HTTPEvent, HttpEventHeaders } from '../types/HTTPEvent';
import {
  askReadRequiredHeader,
  askReadRequiredHeaders,
  getAccessTokenFromHeaders,
  getAllowedOrigins,
  getCorsHeaders,
  getHeaderValue,
  isBot,
} from './headerUtils';

const buildEvent = (headers: HttpEventHeaders): HTTPEvent => ({ headers }) as HTTPEvent;

const prodConfig = (route?: RouteOptions) =>
  buildTestQpqConfig([defineDns('example.com'), ...(route ? [defineDefaultRouteOptions('default', route)] : [])], { environment: 'production' });

describe('getHeaderValue', () => {
  it('looks up a header case-insensitively', () => {
    expect(getHeaderValue('Content-Type', { 'content-type': 'application/json' })).toBe('application/json');
  });

  it('returns null when the header is absent', () => {
    expect(getHeaderValue('authorization', {})).toBeNull();
  });
});

describe('getAccessTokenFromHeaders', () => {
  it('extracts the bearer token from the authorization header', () => {
    expect(getAccessTokenFromHeaders({ authorization: 'Bearer abc.def.ghi' })).toBe('abc.def.ghi');
  });

  it('returns undefined when there is no authorization header', () => {
    expect(getAccessTokenFromHeaders({})).toBeUndefined();
  });
});

describe('askReadRequiredHeader', () => {
  it('returns the header value when present', () => {
    expect(runStory(askReadRequiredHeader(buildEvent({ 'x-token': 'abc' }), 'x-token'))).toBe('abc');
  });

  it('throws NotFound when the header is missing', () => {
    try {
      runStory(askReadRequiredHeader(buildEvent({}), 'x-token'));
      throw new Error('expected a StoryError');
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.NotFound);
    }
  });
});

describe('askReadRequiredHeaders', () => {
  it('returns each required header value in order', () => {
    const event = buildEvent({ a: '1', b: '2' });
    expect(runStory(askReadRequiredHeaders(event, ['a', 'b']))).toEqual(['1', '2']);
  });
});

describe('getAllowedOrigins', () => {
  it('combines the root domain with default and route origins, lowercased', () => {
    const config = prodConfig({ allowedOrigins: ['https://Default.com'] });
    const origins = getAllowedOrigins(config, { allowedOrigins: ['https://Route.com'] });

    expect(origins).toEqual(['https://example.com', 'https://default.com', 'https://route.com']);
  });

  it('expands service entries on every root, roots first', () => {
    const config = buildTestQpqConfig([defineDns(['example.com', 'example.org'])], { environment: 'production' });
    const origins = getAllowedOrigins(config, {
      allowedOrigins: [
        { api: 'api', service: 'billing' },
        { api: 'app', protocol: 'http' },
      ],
    });

    expect(origins).toEqual([
      'https://example.com',
      'https://example.org',
      'https://api.billing.example.com',
      'https://api.billing.example.org',
      'http://app.example.com',
      'http://app.example.org',
    ]);
  });
});

describe('getCorsHeaders', () => {
  it('echoes the matching origin and disables credentials for an open route', () => {
    const config = prodConfig();
    const headers = getCorsHeaders(config, {}, { origin: 'https://example.com' });

    expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    expect(headers['Access-Control-Allow-Credentials']).toBe('false');
  });

  it('enables credentials when the route requires a user directory', () => {
    const config = prodConfig();
    const headers = getCorsHeaders(config, { routeAuthSettings: { userDirectoryName: 'users' } }, { origin: 'https://example.com' });

    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('reflects the preflight-requested headers and method instead of a wildcard', () => {
    const config = prodConfig();
    const headers = getCorsHeaders(
      config,
      {},
      {
        origin: 'https://example.com',
        'access-control-request-headers': 'authorization,x-custom',
        'access-control-request-method': 'PUT',
      },
    );

    expect(headers['Access-Control-Allow-Headers']).toBe('authorization,x-custom');
    expect(headers['Access-Control-Allow-Methods']).toBe('PUT');
    expect(headers['Access-Control-Allow-Headers']).not.toBe('*');
  });

  it('falls back to explicit header and method lists when the request omits them', () => {
    const config = prodConfig();
    const headers = getCorsHeaders(config, {}, { origin: 'https://example.com' });

    expect(headers['Access-Control-Allow-Headers']).toBe('Authorization, Content-Type');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS');
  });
});

describe('isBot', () => {
  it('reports true when the bot header is set', () => {
    expect(isBot(buildEvent({ [qpqHeaderIsBot]: 'true' }))).toBe(true);
  });

  it('reports false otherwise', () => {
    expect(isBot(buildEvent({}))).toBe(false);
  });
});
