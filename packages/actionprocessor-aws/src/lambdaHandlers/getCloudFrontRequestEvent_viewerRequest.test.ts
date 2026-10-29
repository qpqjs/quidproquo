import { qpqHeaderIsBot } from '@qpqjs/webserver';

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

    expect(request!.headers[qpqHeaderIsBot][0]!.value).toBe('true');
  });

  it('does not flag a normal browser user agent as a bot', async () => {
    const request = await runHandler('Mozilla/5.0 (Macintosh; Intel Mac OS X)');

    expect(request!.headers[qpqHeaderIsBot][0]!.value).toBe('false');
  });

  it('defaults to not-a-bot when there is no user agent header', async () => {
    const request = await runHandler();

    expect(request!.headers[qpqHeaderIsBot][0]!.value).toBe('false');
  });

  // Security regression: the bot flag is computed at the edge and must overwrite any copy a client sends.
  it('overwrites a client-supplied bot header with the computed value', async () => {
    const event = buildEvent('Mozilla/5.0 (Macintosh) Chrome/130');
    event!.Records[0]!.cf.request.headers[qpqHeaderIsBot] = [{ key: qpqHeaderIsBot, value: 'true' }];

    const request = await getCloudFrontRequestEvent_viewerRequest()(event, {} as Context);

    expect(request.headers[qpqHeaderIsBot]).toEqual([{ key: qpqHeaderIsBot, value: 'false' }]);
  });
});
