import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig } from '@qpqjs/core';
import { defineCache, qpqHeaderIsBot } from '@qpqjs/webserver';

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';

import { QpqWebServerCacheConstruct } from './QpqWebServerCacheConstruct';

const synth = () => {
  const cacheConfig = defineCache('public', { minTTLInSeconds: 1, maxTTLInSeconds: 100, defaultTTLInSeconds: 10, mustRevalidate: true });
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), cacheConfig]);
  const stack = new Stack(new App(), 'api', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new QpqWebServerCacheConstruct(stack, 'cache', { qpqConfig, cacheConfig });

  return Template.fromStack(stack);
};

// Security regression: the cache key never includes cookies, query strings or Authorization, and the only
// headers it keys on are the bot flag and the CORS request headers, so one user's response is never served
// to another under a different credential and preflight answers cannot be poisoned across origins.
describe('QpqWebServerCacheConstruct', () => {
  it('keys the cache on the bot and CORS headers only, with no cookies or query strings', () => {
    synth().hasResourceProperties('AWS::CloudFront::CachePolicy', {
      CachePolicyConfig: {
        ParametersInCacheKeyAndForwardedToOrigin: {
          CookiesConfig: { CookieBehavior: 'none' },
          QueryStringsConfig: { QueryStringBehavior: 'none' },
          HeadersConfig: {
            HeaderBehavior: 'whitelist',
            Headers: [qpqHeaderIsBot, 'Origin', 'Access-Control-Request-Headers', 'Access-Control-Request-Method'],
          },
        },
      },
    });
  });
});
