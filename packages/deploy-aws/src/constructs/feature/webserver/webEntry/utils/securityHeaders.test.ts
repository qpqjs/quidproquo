import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig } from '@qpqjs/core';
import { defineDns } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { convertSecurityHeadersFromQpqSecurityHeaders } from './securityHeaders';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), defineDns(['example.com'])]);

// Security regression: with no app configuration the baseline headers still apply, and no content security policy is
// invented (a default-src 'self' policy would break a shell that loads federated views from another host).
describe('convertSecurityHeadersFromQpqSecurityHeaders', () => {
  it('applies the baseline headers without a csp when nothing is configured', () => {
    const behaviour = convertSecurityHeadersFromQpqSecurityHeaders(qpqConfig, undefined);

    expect(behaviour.contentSecurityPolicy).toBeUndefined();
    expect(behaviour.strictTransportSecurity?.includeSubdomains).toBe(true);
    expect(behaviour.contentTypeOptions?.override).toBe(true);
    expect(behaviour.frameOptions?.frameOption).toBe('DENY');
    expect(behaviour.referrerPolicy?.referrerPolicy).toBe('strict-origin-when-cross-origin');
  });

  it('defaults the csp to self when security headers are configured without one', () => {
    const behaviour = convertSecurityHeadersFromQpqSecurityHeaders(qpqConfig, {});

    expect(behaviour.contentSecurityPolicy?.contentSecurityPolicy).toBe("default-src 'self'; object-src 'none'");
  });
});
