import { buildTestQpqConfig } from '@qpqjs/testing';
import { defineFileUploadSettings } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { API_GATEWAY_MAX_PAYLOAD_BYTES } from './awsLimits';
import { getAwsFileUploadSettings } from './getAwsFileUploadSettings';

describe('getAwsFileUploadSettings', () => {
  it('fills the per-file ceiling with the api gateway payload cap when the service declares none', () => {
    expect(getAwsFileUploadSettings(buildTestQpqConfig()).maxFileSizeBytes).toBe(API_GATEWAY_MAX_PAYLOAD_BYTES);
  });

  it('keeps a declared per-file ceiling', () => {
    expect(getAwsFileUploadSettings(buildTestQpqConfig([defineFileUploadSettings({ maxFileSizeBytes: 1024 })])).maxFileSizeBytes).toBe(1024);
  });
});
