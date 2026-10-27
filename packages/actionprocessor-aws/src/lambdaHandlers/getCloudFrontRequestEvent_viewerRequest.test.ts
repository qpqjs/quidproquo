import { qpqHeaderIsBot } from 'quidproquo-webserver';

import { CloudFrontRequestEvent, Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { getCloudFrontRequestEvent_viewerRequest } from './getCloudFrontRequestEvent_viewerRequest';

const buildEvent = (userAgent?: string): CloudFrontRequestEvent =>
  ({
    Records: [
      {
        cf: {
          request: {
            headers: userAgent ? { 'user-agent': [{ key: 'User-Agent', value: userAgent }] } : {},
          },
        },
      },
    ],
  }) as any;

const runHandler = (userAgent?: string) => getCloudFrontRequestEvent_viewerRequest()(buildEvent(userAgent), {} as Context);

describe('getCloudFrontRequestEvent_viewerRequest', () => {
  it('flags a known crawler user agent as a bot', async () => {
    const request = await runHandler('Mozilla/5.0 (compatible; googlebot/2.1)');

    expect(request.headers[qpqHeaderIsBot][0].value).toBe('true');
  });

  it('does not flag a normal browser user agent as a bot', async () => {
    const request = await runHandler('Mozilla/5.0 (Macintosh; Intel Mac OS X)');

    expect(request.headers[qpqHeaderIsBot][0].value).toBe('false');
  });

  it('defaults to not-a-bot when there is no user agent header', async () => {
    const request = await runHandler();

    expect(request.headers[qpqHeaderIsBot][0].value).toBe('false');
  });
});
