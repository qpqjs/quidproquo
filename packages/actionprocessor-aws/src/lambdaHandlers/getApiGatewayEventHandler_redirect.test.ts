import { APIGatewayEvent, Context } from 'aws-lambda';
import { afterEach, describe, expect, it } from 'vitest';

import { getApiGatewayEventHandler_redirect } from './getApiGatewayEventHandler_redirect';

const runHandler = (event: Partial<APIGatewayEvent>) => getApiGatewayEventHandler_redirect()(event as APIGatewayEvent, {} as Context);

describe('getApiGatewayEventHandler_redirect', () => {
  afterEach(() => {
    delete process.env.redirectBaseUrl;
    delete process.env.appendPath;
  });

  it('redirects straight to an absolute url', async () => {
    process.env.redirectBaseUrl = JSON.stringify('https://example.com/go');

    const response = await runHandler({ path: '/ignored', queryStringParameters: null });

    expect(response.statusCode).toBe(301);
    expect(response.headers?.Location).toBe('https://example.com/go');
  });

  it('preserves the request path for a domain redirect', async () => {
    process.env.redirectBaseUrl = JSON.stringify('https://staging.example.com');
    process.env.appendPath = JSON.stringify(true);

    const response = await runHandler({ path: '/page', queryStringParameters: null });

    expect(response.headers?.Location).toBe('https://staging.example.com/page');
  });

  it('appends query string parameters to the redirect url', async () => {
    process.env.redirectBaseUrl = JSON.stringify('https://example.com');

    const response = await runHandler({ path: '/', queryStringParameters: { a: '1', b: 'two' } });

    expect(response.headers?.Location).toBe('https://example.com?a=1&b=two');
  });
});
